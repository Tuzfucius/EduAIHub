"""
简单问答模块

基于检索的问答实现。
"""

from __future__ import annotations

import os
from typing import List, Dict, Any, Optional
import httpx

from ..retrievers import SimpleRetriever, RetrievalResult


class SimpleQA:
    """简单问答服务

    基于检索的问答，组合检索器和 LLM。
    """

    def __init__(
        self,
        retriever: SimpleRetriever,
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        max_context_length: int = 4000,
        temperature: float = 0.7,
    ):
        self.retriever = retriever
        self.api_url = api_url or os.getenv("LLM_API_URL", "https://api.siliconflow.cn/v1/chat/completions")
        self.api_key = api_key or os.getenv("LLM_API_KEY", "")
        self.model = model
        self.max_context_length = max_context_length
        self.temperature = temperature
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        """获取 HTTP 客户端"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=120.0)
        return self._client

    async def chat(
        self,
        question: str,
        history: Optional[List[Dict[str, str]]] = None,
        file_ids: Optional[List[str]] = None,
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """问答

        Args:
            question: 问题
            history: 对话历史
            file_ids: 限定文件 ID 列表
            top_k: 检索数量

        Returns:
            包含答案和引用的字典
        """
        context = await self.retriever.retrieve_with_context(
            query=question,
            top_k=top_k,
            file_ids=file_ids,
            max_context_length=self.max_context_length,
        )

        if not context.strip():
            return {
                "answer": "未在知识库中找到相关内容。",
                "context": "",
                "references": [],
            }

        messages = self._build_messages(question, context, history)

        try:
            answer = await self._call_llm(messages)
        except Exception as e:
            return {
                "answer": f"生成答案失败: {str(e)}",
                "context": context,
                "references": [],
            }

        references = await self._extract_references(question, file_ids, top_k)

        return {
            "answer": answer,
            "context": context,
            "references": references,
        }

    def _build_messages(
        self,
        question: str,
        context: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, str]]:
        """构建消息"""
        system_prompt = f"""你是一个智能助手。请根据提供的上下文回答用户的问题。

如果上下文中包含相关信息，请基于上下文回答。
如果上下文中没有相关信息，请说明"未在知识库中找到相关内容"。

上下文：
{context}
"""

        messages = [{"role": "system", "content": system_prompt}]

        if history:
            for msg in history[-5:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                })

        messages.append({"role": "user", "content": question})

        return messages

    async def _call_llm(self, messages: List[Dict[str, str]]) -> str:
        """调用 LLM"""
        client = self._get_client()

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": 2048,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = await client.post(self.api_url, json=payload, headers=headers)
        response.raise_for_status()

        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def _extract_references(
        self,
        question: str,
        file_ids: Optional[List[str]] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """提取引用来源"""
        results = await self.retriever.retrieve(question, top_k, file_ids)

        references = []
        seen_sources = set()

        for r in results:
            source_key = r.source_file_id
            if source_key in seen_sources:
                continue
            seen_sources.add(source_key)

            references.append({
                "filename": r.source_path.split("/")[-1] if r.source_path else r.source_file_id,
                "content": r.content[:200] + "..." if len(r.content) > 200 else r.content,
                "score": r.score,
            })

        return references

    async def close(self):
        """关闭客户端"""
        if self._client:
            await self._client.aclose()
            self._client = None


def create_qa(
    retriever: SimpleRetriever,
    api_url: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> SimpleQA:
    """问答服务工厂函数

    Args:
        retriever: 检索器
        api_url: API 地址
        api_key: API 密钥
        model: 模型名称

    Returns:
        SimpleQA 实例
    """
    return SimpleQA(
        retriever=retriever,
        api_url=api_url,
        api_key=api_key,
        model=model or os.getenv("LLM_MODEL", "gpt-4o"),
    )
