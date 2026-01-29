
import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database import get_db
from models import User, KnowledgeBase, KnowledgeFile
from schemas.rag import KnowledgeBaseCreate, KnowledgeBaseResponse, KnowledgeFileResponse, RagQuery, RagResponse
from routers.auth import get_current_user
from config import settings
from services.rag_service import rag_service

router = APIRouter(prefix="/api/rag", tags=["知识库 (RAG)"])

# Helper to get KB and check ownership
async def get_kb_by_id(kb_id: int, user_id: int, db: AsyncSession):
    query = select(KnowledgeBase).where(KnowledgeBase.id == kb_id, KnowledgeBase.user_id == user_id)
    result = await db.execute(query)
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="知识库不存在或无权访问")
    return kb

@router.post("/kb", response_model=KnowledgeBaseResponse, summary="创建知识库")
async def create_kb(
    kb_data: KnowledgeBaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Determine work_dir
    # Not using actual DB id yet because it's not committed. 
    # But we can update it later or use randomness?
    # Let's simple use: data/rag/{user_id}/{hash_or_name}
    import hashlib
    import time
    
    unique_str = f"{current_user.id}-{kb_data.name}-{time.time()}"
    kb_hash = hashlib.md5(unique_str.encode()).hexdigest()[0:8]
    work_dir = os.path.join(settings.BASE_DIR, "data", "rag", str(current_user.id), kb_hash)
    os.makedirs(work_dir, exist_ok=True)
    
    new_kb = KnowledgeBase(
        user_id=current_user.id,
        name=kb_data.name,
        description=kb_data.description,
        status="empty",
        work_dir=work_dir
    )
    db.add(new_kb)
    await db.commit()
    await db.refresh(new_kb)
    return new_kb

@router.get("/kb", response_model=List[KnowledgeBaseResponse], summary="仅获取知识库列表")
async def list_kbs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Eager load isn't strictly necessary for count but good practice if checking relationship
    # But for count of files, we can do it via relationship lazy load or separate query
    # Pydantic schema doesn't have files list, just count.
    
    query = select(KnowledgeBase).where(KnowledgeBase.user_id == current_user.id).order_by(desc(KnowledgeBase.created_at)).options(selectinload(KnowledgeBase.files))
    result = await db.execute(query)
    kbs = result.scalars().all()
    
    # Calculate file counts manually for Pydantic
    resp = []
    for kb in kbs:
        kb_resp = KnowledgeBaseResponse.model_validate(kb)
        kb_resp.files_count = len(kb.files)
        resp.append(kb_resp)
        
    return resp

@router.get("/kb/{kb_id}", response_model=KnowledgeBaseResponse, summary="获取知识库详情")
async def get_kb_detail(
    kb_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(KnowledgeBase).where(KnowledgeBase.id == kb_id, KnowledgeBase.user_id == current_user.id).options(selectinload(KnowledgeBase.files))
    result = await db.execute(query)
    kb = result.scalar_one_or_none()
    
    if not kb:
        raise HTTPException(status_code=404, detail="知识库不存在")
        
    kb_resp = KnowledgeBaseResponse.model_validate(kb)
    kb_resp.files_count = len(kb.files)
    return kb_resp

@router.get("/kb/{kb_id}/files", response_model=List[KnowledgeFileResponse], summary="获取文件列表")
async def list_files(
    kb_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await get_kb_by_id(kb_id, current_user.id, db) # check auth
    
    query = select(KnowledgeFile).where(KnowledgeFile.kb_id == kb_id).order_by(desc(KnowledgeFile.created_at))
    result = await db.execute(query)
    files = result.scalars().all()
    return files

@router.post("/kb/{kb_id}/upload", response_model=KnowledgeFileResponse, summary="上传文件")
async def upload_file(
    kb_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    kb = await get_kb_by_id(kb_id, current_user.id, db)
    
    # Storage path
    # Put uploaded files in work_dir/uploads or separate?
    # Separate is better for clarity.
    uploads_dir = os.path.join(kb.work_dir, "origin")
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Cleanup filename
    safe_filename = os.path.basename(file.filename)
    save_path = os.path.join(uploads_dir, safe_filename)
    
    # Save file
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(save_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")
    
    # Create DB Entry
    new_file = KnowledgeFile(
        kb_id=kb.id,
        filename=safe_filename,
        file_path=save_path,
        file_size=file_size,
        status="uploaded"
    )
    
    db.add(new_file)
    # Set KB status to "building" or "need_rebuild"?
    kb.status = "building"
    await db.commit()
    await db.refresh(new_file)
    
    return new_file

@router.post("/kb/{kb_id}/build", summary="构建/更新索引")
async def build_index(
    kb_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    kb = await get_kb_by_id(kb_id, current_user.id, db)
    
    # Get all uploaded files
    result = await db.execute(select(KnowledgeFile).where(KnowledgeFile.kb_id == kb_id))
    files = result.scalars().all()
    
    if not files:
        raise HTTPException(status_code=400, detail="知识库为空，请先上传文件")
        
    # Trigger Async Build (Sync wrapper)
    try:
        await rag_service.build_kb_index(kb, files)
        
        # Update status
        kb.status = "ready"
        for f in files:
            f.status = "completed"
            
        await db.commit()
        return {"message": "索引构建成功", "kb_status": "ready"}
        
    except Exception as e:
        kb.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"索引构建失败: {str(e)}")

@router.post("/query", response_model=RagResponse, summary="RAG 问答检索")
async def rag_query(
    query: RagQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    kb = await get_kb_by_id(query.kb_id, current_user.id, db)
    
    if kb.status != "ready":
        # Maybe allow query even if not fully ready? No.
        raise HTTPException(status_code=400, detail=f"知识库状态不可用: {kb.status}")
        
    # Run Query
    try:
        result = await rag_service.query_kb(kb, query.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检索失败: {str(e)}")
