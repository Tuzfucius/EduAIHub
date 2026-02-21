"""
RAG 服务层

基于新模块化架构的 RAG 服务实现。
"""

import os
from typing import List, Dict, Any, Optional
from pathlib import Path

from models.knowledge import KnowledgeBase, KnowledgeFile
from config import settings

from .rag import (
    create_pdf_document,
    create_faiss_store,
    SimpleRetriever,
    create_qa,
    RagConfig,
    create_chunker,
)


class RagService:
    """RAG 服务

    使用新模块化架构，提供知识库构建和问答功能。
    """

    def __init__(self):
        self.config = RagConfig.from_env()
        self._store_cache: Dict[int, SimpleRetriever] = {}

    def _get_store_dir(self, kb: KnowledgeBase) -> str:
        """获取向量索引目录"""
        return os.path.join(kb.work_dir, "index")

    def _get_retriever(self, kb: KnowledgeBase) -> SimpleRetriever:
        """获取或创建检索器（带缓存）"""
        if kb.id in self._store_cache:
            return self._store_cache[kb.id]

        store_dir = self._get_store_dir(kb)
        store = create_faiss_store(store_dir=store_dir)
        retriever = SimpleRetriever(vector_store=store)
        self._store_cache[kb.id] = retriever
        return retriever

    async def build_kb_index(self, kb: KnowledgeBase, files: List[KnowledgeFile]) -> bool:
        """构建/重建知识库索引

        Args:
            kb: 知识库
            files: 文件列表

        Returns:
            是否成功
        """
        work_dir = kb.work_dir
        os.makedirs(work_dir, exist_ok=True)

        all_chunks = []
        file_ids = []

        for f in files:
            if not os.path.exists(f.file_path):
                continue

            file_id = f"{kb.id}_{f.id}"
            file_ids.append(file_id)

            ext = Path(f.file_path).suffix.lower()

            if ext == ".pdf":
                chunks = await self._process_pdf(f.file_path, file_id)
            elif ext in [".txt", ".md"]:
                chunks = self._process_text(f.file_path, file_id)
            else:
                continue

            all_chunks.extend(chunks)

        if not all_chunks:
            return True

        store_dir = self._get_store_dir(kb)
        store = create_faiss_store(store_dir=store_dir)
        await store.add(all_chunks)

        if kb.id in self._store_cache:
            del self._store_cache[kb.id]

        return True

    async def _process_pdf(self, file_path: str, file_id: str) -> List:
        """处理 PDF 文件"""
        pdf = create_pdf_document(
            file_path=file_path,
            chunk_strategy="paragraph",
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
        )
        chunks = pdf.parse()

        for chunk in chunks:
            chunk.metadata["source_file_id"] = file_id

        return chunks

    def _process_text(self, file_path: str, file_id: str) -> List:
        """处理文本文件"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        chunker = create_chunker(
            strategy="paragraph",
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
        )

        chunks = chunker.chunk(content, file_path, file_id)
        return chunks

    async def query_kb(
        self,
        kb: KnowledgeBase,
        question: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """查询知识库

        Args:
            kb: 知识库
            question: 问题
            history: 对话历史

        Returns:
            包含答案和引用的字典
        """
        retriever = self._get_retriever(kb)
        qa = create_qa(retriever=retriever)

        result = await qa.chat(
            question=question,
            history=history,
            top_k=self.config.search_top_k,
        )

        return {
            "rejected": False,
            "answer": result.get("answer", ""),
            "context": result.get("context", ""),
            "references": result.get("references", []),
        }

    async def delete_file_from_kb(self, kb: KnowledgeBase, file_id: str) -> bool:
        """从知识库中删除文件

        Args:
            kb: 知识库
            file_id: 文件 ID

        Returns:
            是否成功
        """
        store_dir = self._get_store_dir(kb)

        if not os.path.exists(store_dir):
            return True

        from .rag import FAISSStore
        store = FAISSStore(store_dir=store_dir)
        await store.delete_by_file_id(file_id)

        if kb.id in self._store_cache:
            del self._store_cache[kb.id]

        return True

    async def clear_kb(self, kb: KnowledgeBase) -> bool:
        """清空知识库

        Args:
            kb: 知识库

        Returns:
            是否成功
        """
        store_dir = self._get_store_dir(kb)

        if os.path.exists(store_dir):
            import shutil
            shutil.rmtree(store_dir)

        if kb.id in self._store_cache:
            del self._store_cache[kb.id]

        return True

    async def get_kb_stats(self, kb: KnowledgeBase) -> Dict[str, Any]:
        """获取知识库统计信息

        Args:
            kb: 知识库

        Returns:
            统计信息
        """
        store_dir = self._get_store_dir(kb)

        if not os.path.exists(store_dir):
            return {
                "document_count": 0,
                "file_count": 0,
            }

        from .rag import FAISSStore
        store = FAISSStore(store_dir=store_dir)
        file_ids = store.get_file_ids()

        return {
            "document_count": store.document_count,
            "file_count": len(file_ids),
        }

    def get_stores_count(self) -> int:
        """获取已加载的存储数量"""
        return len(self._store_cache)


rag_service = RagService()
