from fastapi import APIRouter
from . import auth, study, rag, chat

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["权限管理"])
api_router.include_router(study.router, prefix="/study", tags=["学习与规划"])
api_router.include_router(rag.router, prefix="/rag", tags=["知识库与文档"])
api_router.include_router(chat.router, prefix="/ai", tags=["大模型对话辅助"])
