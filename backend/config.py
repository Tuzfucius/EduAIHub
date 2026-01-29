"""应用配置管理"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """应用配置"""
    
    # 数据库配置
    DATABASE_URL: str = "sqlite+aiosqlite:///./eduaihub.db"
    
    # JWT 配置
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 小时
    
    # CORS 配置
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # RAG / Embedding 配置
    EMBEDDING_API_URL: str = "https://api.siliconflow.cn/v1/embeddings"
    EMBEDDING_API_KEY: str = "" # 必填
    
    BASE_DIR: str = "."
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """将 CORS_ORIGINS 字符串转换为列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# 全局配置实例
settings = Settings()
