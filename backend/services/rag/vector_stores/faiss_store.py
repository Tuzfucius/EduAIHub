"""
FAISS 向量存储实现

基于 FAISS 的本地向量存储实现。
"""

from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import List, Optional
import numpy as np
import faiss

from ..documents.base import DocumentChunk
from .base import BaseVectorStore, SearchResult


class FAISSStore(BaseVectorStore):
    """FAISS 向量存储实现

    使用 FAISS 进行向量检索，支持持久化存储。
    """

    def __init__(
        self,
        store_dir: str,
        embedding_dim: int = 1024,
    ):
        self.store_dir = Path(store_dir)
        self.embedding_dim = embedding_dim

        self.store_dir.mkdir(parents=True, exist_ok=True)

        self.index_path = self.store_dir / "index.faiss"
        self.meta_path = self.store_dir / "metadata.pkl"
        self.manifest_path = self.store_dir / "manifest.json"

        self._index: Optional[faiss.Index] = None
        self._metadata: List[dict] = []
        self._manifest: dict = {}

        self._load()

    def _load(self):
        """加载已存储的数据"""
        if self.index_path.exists() and self.meta_path.exists():
            self._index = faiss.read_index(str(self.index_path))
            with open(self.meta_path, "rb") as f:
                self._metadata = pickle.load(f)
        else:
            self._index = faiss.IndexFlatIP(self.embedding_dim)
            self._metadata = []

        if self.manifest_path.exists():
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                self._manifest = json.load(f)
        else:
            self._manifest = {"documents": []}

    async def save(self):
        """持久化存储"""
        if self._index is not None and self._index.ntotal > 0:
            faiss.write_index(self._index, str(self.index_path))
            with open(self.meta_path, "wb") as f:
                pickle.dump(self._metadata, f)

        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(self._manifest, f, ensure_ascii=False, indent=2)

    async def load(self):
        """加载数据（初始化时自动调用）"""
        self._load()

    async def add(self, documents: List[DocumentChunk]):
        """添加文档分块"""
        if not documents:
            return

        texts = [doc.content for doc in documents]

        from ..embeddings import create_embedding
        embedding = create_embedding()
        vectors = await embedding.embed(texts)

        if self._index is None:
            self._index = faiss.IndexFlatIP(self.embedding_dim)

        self._index.add(vectors)

        for i, doc in enumerate(documents):
            meta = {
                "id": doc.id,
                "content": doc.content,
                "source_file_id": doc.source_file_id,
                "source_path": doc.source_path,
                "chunk_index": doc.chunk_index,
                "metadata": doc.metadata,
            }
            self._metadata.append(meta)

        file_ids = set(doc.source_file_id for doc in documents)
        for file_id in file_ids:
            if file_id not in self._manifest["documents"]:
                self._manifest["documents"].append(file_id)

        await self.save()

    async def search(
        self,
        query: str,
        top_k: int = 5,
        file_ids: Optional[List[str]] = None,
    ) -> List[SearchResult]:
        """搜索相似文档"""
        if self._index is None or self._index.ntotal == 0:
            return []

        from ..embeddings import create_embedding
        embedding = create_embedding()
        query_vec = await embedding.embed([query])

        search_k = top_k
        if file_ids:
            search_k = max(top_k * 20, 100)
        search_k = min(search_k, self._index.ntotal)

        distances, indices = self._index.search(query_vec, search_k)

        results = []
        target_file_ids = set(file_ids) if file_ids else None

        for rank, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(self._metadata):
                continue

            meta = self._metadata[idx]

            if target_file_ids and meta.get("source_file_id") not in target_file_ids:
                continue

            result = SearchResult(
                id=meta.get("id", str(idx)),
                content=meta.get("content", ""),
                score=float(distances[0][rank]),
                metadata=meta,
            )
            results.append(result)

            if len(results) >= top_k:
                break

        return results

    async def delete_by_file_id(self, file_id: str):
        """删除指定文件的所有分块"""
        indices_to_remove = []
        for i, meta in enumerate(self._metadata):
            if meta.get("source_file_id") == file_id:
                indices_to_remove.append(i)

        if not indices_to_remove:
            return

        if self._index is not None and self._index.ntotal > 0:
            remaining_indices = [i for i in range(len(self._metadata)) if i not in indices_to_remove]
            if remaining_indices:
                remaining_vectors = self._index.reconstruct_n(0, len(self._metadata))
                remaining_vectors = np.array([remaining_vectors[i] for i in remaining_indices])
                self._index.reset()
                if len(remaining_vectors) > 0:
                    self._index.add(remaining_vectors)
            else:
                self._index.reset()

        self._metadata = [m for m in self._metadata if m.get("source_file_id") != file_id]
        self._manifest["documents"] = [d for d in self._manifest["documents"] if d != file_id]

        await self.save()

    async def clear(self):
        """清空向量存储"""
        self._index = faiss.IndexFlatIP(self.embedding_dim)
        self._metadata = []
        self._manifest = {"documents": []}

        if self.index_path.exists():
            self.index_path.unlink()
        if self.meta_path.exists():
            self.meta_path.unlink()

    @property
    def document_count(self) -> int:
        if self._index is None:
            return 0
        return self._index.ntotal

    def get_file_ids(self) -> List[str]:
        """获取所有文件 ID"""
        return self._manifest.get("documents", [])


def create_faiss_store(
    store_dir: str,
    embedding_dim: int = 1024,
) -> FAISSStore:
    """FAISS 向量存储工厂函数

    Args:
        store_dir: 存储目录
        embedding_dim: 嵌入向量维度

    Returns:
        FAISSStore 实例
    """
    return FAISSStore(store_dir=store_dir, embedding_dim=embedding_dim)
