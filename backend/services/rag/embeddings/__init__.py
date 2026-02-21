"""
嵌入模块初始化

导出嵌入相关的类和函数。
"""

from .base import BaseEmbedding, DummyEmbedding
from .openai_style import OpenAICompatibleEmbedding, create_embedding

__all__ = [
    "BaseEmbedding",
    "DummyEmbedding",
    "OpenAICompatibleEmbedding",
    "create_embedding",
]
