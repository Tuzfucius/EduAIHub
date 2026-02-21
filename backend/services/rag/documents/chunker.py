"""
文本分块模块

提供多种分块策略，支持按段落、章节等维度切分文本。
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional
import uuid

from .base import DocumentChunk


@dataclass
class ChunkConfig:
    """分块配置"""

    chunk_size: int = 500
    chunk_overlap: int = 50
    min_chunk_size: int = 50
    separator: str = "\n\n"


class BaseChunker:
    """分块器抽象基类"""

    def __init__(self, config: Optional[ChunkConfig] = None):
        self.config = config or ChunkConfig()

    @property
    def name(self) -> str:
        return self.__class__.__name__

    def chunk(self, text: str, source_path: str, source_file_id: str) -> List[DocumentChunk]:
        """主入口：分词文本"""
        if not text or not text.strip():
            return []

        chunks = self._do_chunk(text)

        result = []
        for i, chunk_text in enumerate(chunks):
            if len(chunk_text.strip()) < self.config.min_chunk_size:
                continue

            chunk = DocumentChunk(
                content=chunk_text.strip(),
                metadata={
                    "source_file_id": source_file_id,
                    "source_path": source_path,
                    "chunk_index": i,
                    "chunker": self.name,
                },
            )
            result.append(chunk)

        return result

    def _do_chunk(self, text: str) -> List[str]:
        """实际分词逻辑，子类实现"""
        raise NotImplementedError


class ParagraphChunker(BaseChunker):
    """段落分块器

    按双换行符分割，适合大多数文档
    """

    def _do_chunk(self, text: str) -> List[str]:
        separator = self.config.separator
        chunks = text.split(separator)

        merged = []
        current = ""

        for chunk in chunks:
            if len(current) + len(chunk) <= self.config.chunk_size:
                current += separator + chunk if current else chunk
            else:
                if current:
                    merged.append(current)
                current = chunk

        if current:
            merged.append(current)

        return merged


class SlidingWindowChunker(BaseChunker):
    """滑动窗口分块器

    固定大小滑动窗口，适合长文本
    """

    def _do_chunk(self, text: str) -> List[str]:
        size = self.config.chunk_size
        overlap = self.config.chunk_overlap
        chunks = []

        for i in range(0, len(text), size - overlap):
            chunk = text[i : i + size]
            if chunk:
                chunks.append(chunk)

            if i + size >= len(text):
                break

        return chunks


class HeaderChunker(BaseChunker):
    """按标题分块器

    识别 Markdown/HTML 标题，按章节分割
    """

    def __init__(self, config: Optional[ChunkConfig] = None):
        super().__init__(config)
        self.header_pattern = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)

    def _do_chunk(self, text: str) -> List[str]:
        sections = []
        current_section = ""
        current_headers = []

        lines = text.split("\n")
        in_code_block = False

        for line in lines:
            if line.startswith("```"):
                in_code_block = not in_code_block
                current_section += line + "\n"
                continue

            if in_code_block:
                current_section += line + "\n"
                continue

            header_match = self.header_pattern.match(line)
            if header_match:
                if current_section:
                    sections.append(self._wrap_section(current_section, current_headers))
                current_headers = [header_match.group(2)]
                current_section = line + "\n"
            else:
                current_section += line + "\n"

        if current_section:
            sections.append(self._wrap_section(current_section, current_headers))

        return sections if sections else [text]

    def _wrap_section(self, content: str, headers: List[str]) -> str:
        if headers:
            header_text = " > ".join(headers)
            return f"## {header_text}\n\n{content}"
        return content


def create_chunker(strategy: str = "paragraph", **kwargs) -> BaseChunker:
    """分块器工厂函数

    Args:
        strategy: 分块策略 ("paragraph", "sliding", "header")
        **kwargs: 其他配置参数

    Returns:
        分块器实例
    """
    config = ChunkConfig(**kwargs) if kwargs else None

    strategies = {
        "paragraph": ParagraphChunker,
        "sliding": SlidingWindowChunker,
        "header": HeaderChunker,
        "default": ParagraphChunker,
    }

    chunker_class = strategies.get(strategy, strategies["default"])
    return chunker_class(config)
