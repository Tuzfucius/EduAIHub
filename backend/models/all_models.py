from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    courses = relationship("Course", back_populates="owner", cascade="all, delete-orphan")
    tasks = relationship("FocusTask", back_populates="owner", cascade="all, delete-orphan")
    knowledge_bases = relationship("KnowledgeBase", back_populates="owner", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    chapter = Column(String(200))
    progress = Column(Float, default=0.0)
    icon = Column(String(50), default="BookOpen")
    color = Column(String(50), default="#6750A4")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="courses")

class FocusTask(Base):
    __tablename__ = "focus_tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(500))
    start_time = Column(String(10), nullable=False)
    duration = Column(Integer, default=60)
    date = Column(String(20), nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    color = Column(String(50), default="#6750A4")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="tasks")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    owner = relationship("User", back_populates="knowledge_bases")
    documents = relationship("Document", back_populates="kb", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    kb_id = Column(Integer, ForeignKey("knowledge_bases.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    unique_name = Column(String(255), nullable=False, unique=True, index=True) # UUID based
    file_type = Column(String(50))
    file_size = Column(Integer)
    status = Column(String(50), default="pending") # pending, processing, ready, error
    error_msg = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    kb = relationship("KnowledgeBase", back_populates="documents")
