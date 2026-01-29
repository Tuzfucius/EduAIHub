"""认证相关的 Pydantic 模型"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    """用户注册请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, description="密码")
    name: str = Field(..., min_length=1, max_length=100, description="姓名")
    grade: Optional[str] = Field(None, max_length=50, description="年级")


class UserLogin(BaseModel):
    """用户登录请求"""
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class UserResponse(BaseModel):
    """用户信息响应"""
    id: int
    username: str
    name: str
    grade: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    theme: str
    language: str
    created_at: datetime
    
    model_config = {"from_attributes": True}


class Token(BaseModel):
    """JWT 令牌响应"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """JWT 令牌数据"""
    user_id: Optional[int] = None
