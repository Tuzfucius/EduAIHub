"""
RAG 模块配置

统一管理 RAG 相关的配置。
"""

import os
from dataclasses import dataclass


@dataclass
class RagConfig:
    """RAG 配置"""

    embedding_api_url: str = "https://api.siliconflow.cn/v1/embeddings"
    embedding_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"

    llm_api_url: str = "https://api.siliconflow.cn/v1/chat/completions"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o"

    chunk_size: int = 500
    chunk_overlap: int = 50
    search_top_k: int = 5
    max_context_length: int = 4000

    @classmethod
    def from_env(cls) -> "RagConfig":
        """从环境变量加载配置"""
        return cls(
            embedding_api_url=os.getenv("EMBEDDING_API_URL", cls.embedding_api_url),
            embedding_api_key=os.getenv("EMBEDDING_API_KEY", cls.embedding_api_key),
            embedding_model=os.getenv("EMBEDDING_MODEL", cls.embedding_model),
            llm_api_url=os.getenv("LLM_API_URL", cls.llm_api_url),
            llm_api_key=os.getenv("LLM_API_KEY", cls.llm_api_key),
            llm_model=os.getenv("LLM_MODEL", cls.llm_model),
            chunk_size=int(os.getenv("CHUNK_SIZE", cls.chunk_size)),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", cls.chunk_overlap)),
            search_top_k=int(os.getenv("SEARCH_TOP_K", cls.search_top_k)),
            max_context_length=int(os.getenv("MAX_CONTEXT_LENGTH", cls.max_context_length)),
        )


rag_config = RagConfig.from_env()
