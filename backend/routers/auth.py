"""认证 API 路由"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated

from database import get_db
from models import User
from schemas import UserRegister, UserLogin, UserResponse, Token, TokenData
from security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["认证"])
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """依赖注入：获取当前登录用户"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


@router.post("/register", response_model=Token, summary="用户注册")
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    注册新用户
    
    - **username**: 用户名（3-50 字符，唯一）
    - **password**: 密码（至少 6 字符）
    - **name**: 姓名
    - **grade**: 年级（可选）
    """
    # 检查用户名是否已存在
    result = await db.execute(select(User).where(User.username == user_data.username))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 创建新用户
    new_user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        grade=user_data.grade,
        role="student"
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # 生成 JWT 令牌
    access_token = create_access_token(data={"sub": new_user.id})
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=Token, summary="用户登录")
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    用户登录
    
    - **username**: 用户名
    - **password**: 密码
    """
    # 查找用户
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 验证密码
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 生成 JWT 令牌
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def get_me(current_user: User = Depends(get_current_user)):
    """
    获取当前登录用户的信息
    
    需要在请求头中携带 JWT 令牌：
    ```
    Authorization: Bearer <token>
    ```
    """
    return UserResponse.model_validate(current_user)
