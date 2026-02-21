"""
OpenAI 兼容嵌入模块

实现调用 OpenAI 兼容 API 的嵌入模型。
"""

from __future__ import annotations

import os
from typing import List, Optional
import httpx
import numpy as np

from .base import BaseEmbedding


class OpenAICompatibleEmbedding(BaseEmbedding):
    """OpenAI 兼容 API 嵌入模型

    支持 SiliconFlow、OpenAI、Azure OpenAI 等兼容接口
    """

    def __init__(
        self,
        api_url: str,
        api_key: str,
        model: str = "text-embedding-3-small",
        batch_size: int = 10,
        timeout: float = 60.0,
    ):
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.batch_size = batch_size
        self.timeout = timeout

        self._dimension: Optional[int] = None
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        """获取 HTTP 客户端（懒加载）"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    @property
    def dimension(self) -> int:
        if self._dimension is None:
            self._dimension = self._infer_dimension()
        return self._dimension

    def _infer_dimension(self) -> int:
        """根据模型名称推断维度（常见模型）"""
        model_dimensions = {
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072,
            "text-embedding-ada-002": 1536,
            "text-embedding-ada-002-v2": 1536,
            "BAAI/bge-large-zh-v1.5": 1024,
            "BAAI/bge-base-zh-v1.5": 768,
            "BAAI/bge-small-zh-v1.5": 512,
            "BAAI/bge-m3": 1024,
            "shibing624/text2vec-base-chinese": 768,
            "GanymedeNil/text2vec-base-chinese": 768,
        }

        for model_pattern, dim in model_dimensions.items():
            if model_pattern in self.model:
                return dim

        return 1024

    async def embed(self, texts: List[str]) -> np.ndarray:
        """调用 API 获取嵌入向量"""
        if not texts:
            return np.array([], dtype=np.float32).reshape(0, self.dimension)

        client = self._get_client()
        all_embeddings = []
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]

            payload = {
                "model": self.model,
                "input": [t.replace("\n", " ") for t in batch],
            }

            try:
                response = await client.post(
                    f"{self.api_url}/embeddings",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

                batch_embeddings = [item["embedding"] for item in data["data"]]
                all_embeddings.extend(batch_embeddings)

            except httpx.HTTPStatusError as e:
                raise RuntimeError(f"Embedding API error: {e.response.status_code} - {e.response.text}")
            except Exception as e:
                raise RuntimeError(f"Embedding failed: {str(e)}")

        arr = np.asarray(all_embeddings, dtype=np.float32)
        return arr

    async def close(self):
        """关闭客户端"""
        if self._client:
            await self._client.aclose()
            self._client = None

    def __del__(self):
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.close())
            else:
                loop.run_until_complete(self.close())
        except Exception:
            pass


def create_embedding(
    api_url: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    embedding_type: str = "openai",
) -> BaseEmbedding:
    """嵌入模型工厂函数

    Args:
        api_url: API 地址
        api_key: API 密钥
        model: 模型名称
        embedding_type: 嵌入类型 ("openai" 或 "dummy")

    Returns:
        嵌入模型实例
    """
    if embedding_type == "dummy":
        return DummyEmbedding()

    api_url = api_url or os.getenv("EMBEDDING_API_URL", "https://api.siliconflow.cn/v1/embeddings")
    api_key = api_key or os.getenv("EMBEDDING_API_KEY", "")
    model = model or os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

    return OpenAICompatibleEmbedding(
        api_url=api_url,
        api_key=api_key,
        model=model,
    )
