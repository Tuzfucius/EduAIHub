
"""知识库数据模型"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class KnowledgeBase(Base):
    """知识库模型 (对应一个学科或分类)"""
    __tablename__ = "knowledge_bases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False) # e.g. "高等数学", "C++编程"
    description = Column(String(500), nullable=True)
    
    # 状态: empty, building, ready, failed
    status = Column(String(50), default="empty") 
    
    # 存储 WorkDir 路径 (HuixiangDou workdir)
    work_dir = Column(String(500), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # 关联
    files = relationship("KnowledgeFile", back_populates="kb", cascade="all, delete-orphan")


class KnowledgeFile(Base):
    """知识库文件模型"""
    __tablename__ = "knowledge_files"

    id = Column(Integer, primary_key=True, index=True)
    kb_id = Column(Integer, ForeignKey("knowledge_bases.id"), nullable=False)
    
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False) # 原始文件存储路径
    file_size = Column(Integer, default=0)
    file_hash = Column(String(64), nullable=True) # MD5 check
    
    # 状态: uploaded, processing, completed, failed
    status = Column(String(50), default="uploaded")
    error_msg = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    kb = relationship("KnowledgeBase", back_populates="files")
