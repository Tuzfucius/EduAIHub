"""
文档抽象基类模块

定义文档解析的通用接口，支持多种文档类型的扩展。
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid


@dataclass
class DocumentChunk:
    """文档分块"""

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    content: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def source_file_id(self) -> Optional[str]:
        return self.metadata.get("source_file_id")

    @property
    def chunk_index(self) -> int:
        return self.metadata.get("chunk_index", -1)

    @property
    def source_path(self) -> Optional[str]:
        return self.metadata.get("source_path")


@dataclass
class DocumentMetadata:
    """文档元信息"""

    source_path: str
    title: str = ""
    file_type: str = ""
    file_size: int = 0
    page_count: int = 0


class BaseDocument(ABC):
    """文档抽象基类"""

    def __init__(self, file_path: str):
        self.file_path = Path(file_path)
        self._metadata: Optional[DocumentMetadata] = None

    @property
    @abstractmethod
    def content(self) -> str:
        """获取文档纯文本内容"""
        pass

    @abstractmethod
    def parse(self) -> List[DocumentChunk]:
        """解析文档并返回分块列表"""
        pass

    @property
    def metadata(self) -> DocumentMetadata:
        """获取文档元信息（延迟加载）"""
        if self._metadata is None:
            self._metadata = self._load_metadata()
        return self._metadata

    def _load_metadata(self) -> DocumentMetadata:
        """加载元信息，子类可重写"""
        stat = self.file_path.stat()
        return DocumentMetadata(
            source_path=str(self.file_path),
            title=self.file_path.stem,
            file_type=self.file_path.suffix.lower(),
            file_size=stat.st_size,
        )

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(path={self.file_path.name})"
