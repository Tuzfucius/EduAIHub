from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Knowledge Base ---

class KnowledgeBaseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "高等数学资料库",
                "description": "包含大一高数上下册课件及习题"
            }
        }

class KnowledgeFileResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class KnowledgeBaseResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    work_dir: str
    files_count: int = 0  # 额外计算字段
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- RAG Chat ---

class RagQuery(BaseModel):
    kb_id: int
    question: str
    history: List[str] = [] # 简单历史列表，可选
    
    class Config:
        json_schema_extra = {
            "example": {
                "kb_id": 1,
                "question": "什么是泰勒展开？",
                "history": []
            }
        }

class Reference(BaseModel):
    filename: str
    content: str
    score: float

class RagResponse(BaseModel):
    answer: str
    references: List[Reference]
    rejected: bool # 是否被拒答
