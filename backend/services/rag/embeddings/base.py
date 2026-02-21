"""
嵌入抽象基类模块

定义嵌入模型的通用接口，支持多种嵌入后端的扩展。
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List
import numpy as np


class BaseEmbedding(ABC):
    """嵌入模型抽象基类"""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """返回嵌入向量的维度"""
        pass

    @abstractmethod
    async def embed(self, texts: List[str]) -> np.ndarray:
        """将文本列表转换为嵌入向量

        Args:
            texts: 文本列表

        Returns:
            shape: (len(texts), dimension) 的 numpy 数组
        """
        pass

    async def embed_one(self, text: str) -> np.ndarray:
        """嵌入单个文本

        Args:
            text: 单个文本

        Returns:
            shape: (dimension,) 的 numpy 数组
        """
        result = await self.embed([text])
        return result[0]

    async def embed_query(self, query: str) -> np.ndarray:
        """嵌入查询文本（快捷方法）

        默认调用 embed_one，可重写优化查询嵌入
        """
        return await self.embed_one(query)


class DummyEmbedding(BaseEmbedding):
    """虚拟嵌入（用于测试）

    返回随机向量
    """

    def __init__(self, dimension: int = 1024):
        self._dimension = dimension
        self._rng = np.random.RandomState(42)

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed(self, texts: List[str]) -> np.ndarray:
        vectors = self._rng.randn(len(texts), self._dimension).astype(np.float32)
        norm = np.linalg.norm(vectors, axis=1, keepdims=True)
        vectors = vectors / (norm + 1e-8)
        return vectors
