"""FastAPI 应用入口"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db, close_db
from routers import auth_router, proxy


# ... (omitted)



@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    print("🚀 正在初始化数据库...")
    await init_db()
    print("✅ 数据库初始化完成")
    
    yield
    
    # 关闭时清理资源
    print("🔄 正在关闭数据库连接...")
    await close_db()
    print("✅ 数据库连接已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="EduAIHub API",
    description="EduAIHub2 后端 API - AI 驱动的学习助手",
    version="2.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """日志中间件"""
    print(f"📥 [{request.method}] {request.url}")
    response = await call_next(request)
    print(f"📤 [{request.method}] {request.url} -> {response.status_code}")
    return response

# 注册路由
app.include_router(auth_router)
app.include_router(proxy.router)


@app.get("/", tags=["根路径"])
async def root():
    """API 根路径"""
    return {
        "message": "欢迎使用 EduAIHub API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "running"
    }



from pydantic import BaseModel
from typing import Dict, Any, Optional

class LogMessage(BaseModel):
    tag: str
    message: str
    data: Optional[Dict[str, Any]] = None

@app.post("/api/log", tags=["Debug"])
async def debug_log(log: LogMessage):
    """前端日志中继"""
    print(f"📝 [{log.tag}] {log.message}")
    if log.data:
        import json
        try:
            print(json.dumps(log.data, indent=2, ensure_ascii=False))
        except:
            print(log.data)
    return {"status": "ok"}

@app.get("/health", tags=["健康检查"])
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
