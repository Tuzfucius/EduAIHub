"""
向量存储抽象基类模块

定义向量存储的通用接口，支持多种向量数据库后端的扩展。
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class SearchResult:
    """搜索结果"""

    id: str
    content: str
    score: float
    metadata: dict


class BaseVectorStore(ABC):
    """向量存储抽象基类"""

    @abstractmethod
    async def add(self, documents: List["DocumentChunk"]):  # type: ignore[name-defined]
        """添加文档分块到向量存储

        Args:
            documents: 文档分块列表
        """
        pass

    @abstractmethod
    async def search(
        self,
        query: str,
        top_k: int = 5,
        file_ids: Optional[List[str]] = None,
    ) -> List[SearchResult]:
        """搜索相似文档

        Args:
            query: 查询文本
            top_k: 返回结果数量
            file_ids: 限定文件 ID 列表

        Returns:
            搜索结果列表
        """
        pass

    @abstractmethod
    async def delete_by_file_id(self, file_id: str):
        """删除指定文件的所有分块

        Args:
            file_id: 文件 ID
        """
        pass

    @abstractmethod
    async def clear(self):
        """清空向量存储"""
        pass

    @abstractmethod
    async def save(self):
        """持久化存储"""
        pass

    @abstractmethod
    async def load(self):
        """加载已存储的数据"""
        pass

    @property
    @abstractmethod
    def document_count(self) -> int:
        """返回文档分块数量"""
        pass
