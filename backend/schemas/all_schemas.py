from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- User ---
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Course ---
class CourseBase(BaseModel):
    title: str
    chapter: Optional[str] = None
    progress: float = 0.0
    icon: str = "BookOpen"
    color: str = "#6750A4"

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- FocusTask ---
class FocusTaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: str
    duration: int = 60
    date: str
    color: str = "#6750A4"

class FocusTaskCreate(FocusTaskBase):
    pass

class FocusTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None
    duration: Optional[int] = None
    date: Optional[str] = None
    completed: Optional[bool] = None
    color: Optional[str] = None

class FocusTaskResponse(FocusTaskBase):
    id: int
    user_id: int
    completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- KnowledgeBase ---
class KBBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class KBCreate(KBBase):
    pass

class KBResponse(KBBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Document ---
class DocumentResponse(BaseModel):
    id: int
    kb_id: int
    filename: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    status: str
    error_msg: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
