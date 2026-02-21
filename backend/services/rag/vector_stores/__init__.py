"""
向量存储模块初始化

导出向量存储相关的类和函数。
"""

from .base import BaseVectorStore, SearchResult
from .faiss_store import FAISSStore, create_faiss_store

__all__ = [
    "BaseVectorStore",
    "SearchResult",
    "FAISSStore",
    "create_faiss_store",
]
