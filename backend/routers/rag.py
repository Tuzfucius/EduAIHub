 
import os
import shutil
import re
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
from schemas.rag import (
    KnowledgeBaseCreate, KnowledgeBaseResponse, KnowledgeFileResponse, 
    RagQuery, RagResponse, TempFileUploadResponse, AutoClassifyRequest, AutoClassifyResponse
)

import uuid


def sanitize_kb_name(name: str) -> str:
    """KB 名称标准化：只保留字母、数字、中文和常用运算符
    
    保留字符包括:
    - 字母 (a-z, A-Z)
    - 数字 (0-9)
    - 中文 (\u4e00-\u9fff)
    - 常用运算符和分隔符: +, -, *, /, =, _, (, ), [ ], { }, ., ,, :, ;, ', ", `, ~, @, #
    - 数学符号: ≤, ≥, ≠, ∞, √, ∑, ∫, ∂, ∇, ∆, π, σ, μ, λ, α, β, γ, δ, ε, θ
    """
    import re
    
    # 只保留允许的字符
    # 中文范围: \u4e00-\u9fff
    # 运算符: + - * / = _ ( ) [ ] { } . , : ; ' " ` ~ @ # ≤ ≥ ≠ ∞ √ ∑ ∫ ∂ ∇ Δ π σ μ λ α β γ δ ε θ
    
    allowed_pattern = r'[a-zA-Z0-9\u4e00-\u9fff+\-*/=_()\[\]{}.,:;"\'`~@#≤≥≠∞√∑∫∂∇Δπσμλαβγδεθ]+'
    
    matches = re.findall(allowed_pattern, name)
    sanitized = ''.join(matches)
    
    # 清理连续的下划线或空格
    sanitized = re.sub(r'_+', '_', sanitized)
    sanitized = sanitized.strip('_')
    
    return sanitized if sanitized else "未命名知识库"


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
    # KB 名称标准化
    kb_name = sanitize_kb_name(kb_data.name)
    
    # 目录结构: material/{user_id}/{kb_name}/
    work_dir = os.path.join(
        settings.BASE_DIR,
        settings.MATERIAL_DIR,
        str(current_user.id),
        kb_name
    )
    
    # 创建目录
    os.makedirs(work_dir, exist_ok=True)
    
    # 创建 origin/ 子目录
    origin_dir = os.path.join(work_dir, "origin")
    os.makedirs(origin_dir, exist_ok=True)
    
    new_kb = KnowledgeBase(
        user_id=current_user.id,
        name=kb_name,
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
    
    # Storage path: origin/ 子目录
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
        
    try:
        result = await rag_service.query_kb(kb, query.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检索失败: {str(e)}")

@router.post("/upload/temp", response_model=TempFileUploadResponse, summary="上传临时文件(用于自动分类)")
async def upload_temp_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload file to a temporary area for classification"""
    # Temp dir: material/.temp/{user_id}/
    temp_dir = os.path.join(settings.BASE_DIR, settings.MATERIAL_DIR, ".temp", str(current_user.id))
    os.makedirs(temp_dir, exist_ok=True)
    
    # Unique ID
    temp_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    save_path = os.path.join(temp_dir, temp_id + ext)
    
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {e}")
        
    # Read summary (first 500 chars)
    summary = "Binary content"
    try:
        with open(save_path, "r", encoding="utf-8", errors="ignore") as f:
            summary = f.read(500).replace("\n", " ")
    except:
        pass
        
    return TempFileUploadResponse(
        temp_file_id=temp_id + ext,
        original_filename=file.filename,
        summary=summary
    )

@router.post("/classify", response_model=AutoClassifyResponse, summary="自动分类并归档文件")
async def auto_classify(
    req: AutoClassifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Auto identify which KB the file belongs to, create KB if needed, and move file.
    """
    # Temp dir: material/.temp/{user_id}/
    temp_dir = os.path.join(settings.BASE_DIR, settings.MATERIAL_DIR, ".temp", str(current_user.id))
    temp_path = os.path.join(temp_dir, req.temp_file_id)
    
    if not os.path.exists(temp_path):
        raise HTTPException(status_code=404, detail="Temp file not found")
        
    # 1. Get existing KBs
    result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.user_id == current_user.id))
    existing_kbs = result.scalars().all()
    kb_names = [kb.name for kb in existing_kbs]
    
    # 2. Call LLM to classify
    target_kb_name, reason, is_new = await rag_service.auto_classify_file(
        file_path=temp_path, 
        filename=req.original_filename, 
        kbs=kb_names
    )
    
    if not target_kb_name:
        target_kb_name = "未分类归档"
        is_new = True
        
    # 3. Find or Create KB
    target_kb = None
    if not is_new:
        for kb in existing_kbs:
            if kb.name == target_kb_name:
                target_kb = kb
                break
    
    if not target_kb:
        # Create New KB
        target_kb_name = sanitize_kb_name(target_kb_name)
        work_dir = os.path.join(
            settings.BASE_DIR,
            settings.MATERIAL_DIR,
            str(current_user.id),
            target_kb_name
        )
        os.makedirs(work_dir, exist_ok=True)
        
        # 创建 origin 子目录
        origin_dir = os.path.join(work_dir, "origin")
        os.makedirs(origin_dir, exist_ok=True)
        
        target_kb = KnowledgeBase(
            user_id=current_user.id,
            name=target_kb_name,
            description=f"Auto-created for {req.original_filename}. Reason: {reason}",
            status="empty",
            work_dir=work_dir
        )
        db.add(target_kb)
        await db.commit()
        await db.refresh(target_kb)
        
    # 4. Move File from Temp to KB Origin
    uploads_dir = os.path.join(target_kb.work_dir, "origin")
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Handle filename conflict?
    final_path = os.path.join(uploads_dir, req.original_filename)
    if os.path.exists(final_path):
        base, ext = os.path.splitext(req.original_filename)
        final_path = os.path.join(uploads_dir, f"{base}_{uuid.uuid4().hex[:4]}{ext}")
        
    shutil.move(temp_path, final_path)
    file_size = os.path.getsize(final_path)
    
    # 5. Create KnowledgeFile record
    new_file = KnowledgeFile(
        kb_id=target_kb.id,
        filename=os.path.basename(final_path),
        file_path=final_path,
        file_size=file_size,
        status="uploaded"
    )
    db.add(new_file)
    target_kb.status = "building" # Mark validation needed
    await db.commit()
    await db.refresh(new_file)
    
    return AutoClassifyResponse(
        kb_name=target_kb.name,
        kb_id=target_kb.id,
        reason=reason or "Auto classified",
        status="success",
        file_id=new_file.id
    )
