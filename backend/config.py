"""应用配置管理"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
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

    # 文件存储配置
    BASE_DIR: str = str(Path(__file__).parent.parent)  # 项目根目录
    MATERIAL_DIR: str = "material"  # 知识库文件存储目录

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """将 CORS_ORIGINS 字符串转换为列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def material_path(self) -> str:
        """获取 material 目录完整路径"""
        return str(Path(self.BASE_DIR) / self.MATERIAL_DIR)


# 全局配置实例
settings = Settings()
