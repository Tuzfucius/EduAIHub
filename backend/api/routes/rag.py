import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from database import get_db
from models.all_models import KnowledgeBase, Document, User
from schemas.all_schemas import KBCreate, KBResponse, DocumentResponse
from api.deps import get_current_user

router = APIRouter()

@router.get("/kb", response_model=List[KBResponse])
async def list_knowledge_bases(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(KnowledgeBase).where(KnowledgeBase.user_id == current_user.id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/kb", response_model=KBResponse)
async def create_knowledge_base(
    kb_in: KBCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 安全检查：防止同名
    query = select(KnowledgeBase).where(KnowledgeBase.user_id == current_user.id, KnowledgeBase.name == kb_in.name)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Knowledge base with this name already exists")
        
    kb = KnowledgeBase(name=kb_in.name, description=kb_in.description, user_id=current_user.id)
    db.add(kb)
    await db.commit()
    await db.refresh(kb)
    return kb

@router.post("/kb/{kb_id}/documents", response_model=DocumentResponse)
async def upload_document(
    kb_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(KnowledgeBase).where(KnowledgeBase.id == kb_id, KnowledgeBase.user_id == current_user.id)
    result = await db.execute(query)
    kb = result.scalars().first()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
        
    # 安全：采用UUID命名落盘防止路径穿越攻击 ../
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    upload_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc = Document(
        kb_id=kb.id,
        filename=file.filename,
        unique_name=unique_filename,
        file_type=file.content_type,
        file_size=os.path.getsize(upload_path),
        status="ready" 
        # 此处预留 processing 状态供后续异步 RAG 索引队列使用
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

@router.get("/kb/{kb_id}/documents", response_model=List[DocumentResponse])
async def list_documents(
    kb_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(KnowledgeBase).where(KnowledgeBase.id == kb_id, KnowledgeBase.user_id == current_user.id)
    result = await db.execute(query)
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Knowledge base not found")
        
    doc_query = select(Document).where(Document.kb_id == kb_id)
    doc_result = await db.execute(doc_query)
    return doc_result.scalars().all()
