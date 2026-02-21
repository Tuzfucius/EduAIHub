from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduAIHub 3.0"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "b4435b0266008b89e776e1081691238dc85966ba477e682496aebd00c5cff9a4")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./eduaihub.db")
    
    # AI Config
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    
    # RAG Settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./data/uploads")
    VECTOR_DB_DIR: str = os.getenv("VECTOR_DB_DIR", "./data/vector_db")

    class Config:
        case_sensitive = True

settings = Settings()

# 确保必要的目录存在
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_DB_DIR, exist_ok=True)
