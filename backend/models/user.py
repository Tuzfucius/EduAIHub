"""用户数据模型"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    grade = Column(String(50), nullable=True)  # 年级，如 "大一"、"大二"
    email = Column(String(255), unique=True, index=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(50), default="student")  # student, teacher, admin
    theme = Column(String(20), default="light")  # light, dark
    language = Column(String(10), default="zh")  # zh, en
    created_at = Column(DateTime(timezone=True), server_default=func.now())
