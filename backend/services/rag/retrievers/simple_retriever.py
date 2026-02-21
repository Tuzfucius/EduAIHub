"""
简单检索器实现

基于向量存储的检索器，支持按文件过滤。
"""

from __future__ import annotations

from typing import List, Optional
from dataclasses import dataclass

from ..vector_stores.base import SearchResult, BaseVectorStore


@dataclass
class RetrievalResult:
    """检索结果"""

    content: str
    source_file_id: str
    source_path: str
    score: float
    chunk_index: int


class SimpleRetriever:
    """简单检索器

    组合向量存储和嵌入模型，提供检索功能。
    """

    def __init__(
        self,
        vector_store: BaseVectorStore,
    ):
        self.vector_store = vector_store

    async def retrieve(
        self,
        query: str,
        top_k: int = 5,
        file_ids: Optional[List[str]] = None,
    ) -> List[RetrievalResult]:
        """检索相关文档

        Args:
            query: 查询文本
            top_k: 返回结果数量
            file_ids: 限定文件 ID 列表

        Returns:
            检索结果列表
        """
        results = await self.vector_store.search(
            query=query,
            top_k=top_k,
            file_ids=file_ids,
        )

        retrieval_results = []
        for r in results:
            retrieval_results.append(
                RetrievalResult(
                    content=r.content,
                    source_file_id=r.metadata.get("source_file_id", ""),
                    source_path=r.metadata.get("source_path", ""),
                    score=r.score,
                    chunk_index=r.metadata.get("chunk_index", -1),
                )
            )

        return retrieval_results

    async def retrieve_with_context(
        self,
        query: str,
        top_k: int = 5,
        file_ids: Optional[List[str]] = None,
        max_context_length: int = 3000,
    ) -> str:
        """检索并拼接上下文

        Args:
            query: 查询文本
            top_k: 返回结果数量
            file_ids: 限定文件 ID 列表
            max_context_length: 最大上下文长度

        Returns:
            拼接的上下文文本
        """
        results = await self.retrieve(query, top_k, file_ids)

        context_parts = []
        current_length = 0

        for r in results:
            part = f"[来源: {r.source_file_id}]\n{r.content}\n"
            if current_length + len(part) > max_context_length:
                break
            context_parts.append(part)
            current_length += len(part)

        return "\n".join(context_parts)

    def get_file_ids(self) -> List[str]:
        """获取所有文件 ID"""
        if hasattr(self.vector_store, "get_file_ids"):
            return self.vector_store.get_file_ids()
        return []
