"""
文档模块初始化

导出文档相关的类和函数。
"""

from .base import BaseDocument, DocumentChunk, DocumentMetadata
from .pdf_parser import PDFDocument, create_pdf_document
from .chunker import (
    BaseChunker,
    ChunkConfig,
    ParagraphChunker,
    SlidingWindowChunker,
    HeaderChunker,
    create_chunker,
)

__all__ = [
    "BaseDocument",
    "DocumentChunk",
    "DocumentMetadata",
    "PDFDocument",
    "create_pdf_document",
    "BaseChunker",
    "ChunkConfig",
    "ParagraphChunker",
    "SlidingWindowChunker",
    "HeaderChunker",
    "create_chunker",
]
