"""
PDF 解析模块

使用 PyMuPDF 解析 PDF 文档，支持文本、表格等提取。
"""

from __future__ import annotations

from pathlib import Path
from typing import List, Optional, Dict, Any
import fitz

from .base import BaseDocument, DocumentChunk, DocumentMetadata
from .chunker import create_chunker, ChunkConfig


class PDFDocument(BaseDocument):
    """PDF 文档解析器"""

    def __init__(
        self,
        file_path: str,
        chunk_config: Optional[ChunkConfig] = None,
        chunk_strategy: str = "paragraph",
    ):
        super().__init__(file_path)
        self.chunker = create_chunker(chunk_strategy, chunk_config)
        self._doc: Optional[fitz.Document] = None
        self._text_content: Optional[str] = None

    def _load_document(self) -> fitz.Document:
        """延迟加载 PDF 文档"""
        if self._doc is None:
            if not self.file_path.exists():
                raise FileNotFoundError(f"PDF file not found: {self.file_path}")
            self._doc = fitz.open(str(self.file_path))
        return self._doc

    @property
    def content(self) -> str:
        if self._text_content is None:
            doc = self._load_document()
            text_parts = []
            for page in doc:
                text_parts.append(page.get_text())
            self._text_content = "\n".join(text_parts)
        return self._text_content or ""

    def parse(self) -> List[DocumentChunk]:
        """解析 PDF 并返回分块"""
        doc = self._load_document()
        source_file_id = self.file_path.stem

        chunks = []

        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            page_chunks = self.chunker.chunk(
                page_text,
                str(self.file_path),
                source_file_id,
            )

            for chunk in page_chunks:
                chunk.metadata["page"] = page_num + 1
                chunks.append(chunk)

        return chunks

    def _load_metadata(self) -> DocumentMetadata:
        doc = self._load_document()
        stat = self.file_path.stat()

        return DocumentMetadata(
            source_path=str(self.file_path),
            title=self.file_path.stem,
            file_type=".pdf",
            file_size=stat.st_size,
            page_count=len(doc),
        )

    def extract_tables(self) -> List[Dict[str, Any]]:
        """提取表格（基础实现）

        返回:
            表格列表，每个表格包含表头和行数据
        """
        doc = self._load_document()
        tables = []

        for page_num, page in enumerate(doc):
            tables_on_page = page.find_tables()

            for table_idx, table in enumerate(tables_on_page):
                table_data = {
                    "page": page_num + 1,
                    "table_index": table_idx,
                    "headers": [],
                    "rows": [],
                }

                try:
                    header_row = table.header.row
                    if header_row:
                        table_data["headers"] = [str(cell) for cell in header_row]

                    for row in table.rows:
                        table_data["rows"].append([str(cell) for cell in row])

                    if table_data["headers"] or table_data["rows"]:
                        tables.append(table_data)
                except Exception:
                    continue

        return tables

    def extract_images(self) -> List[Dict[str, Any]]:
        """提取图片信息

        返回:
            图片列表，每个图片包含位置信息和保存路径
        """
        doc = self._load_document()
        images = []

        for page_num, page in enumerate(doc):
            img_list = page.get_images(full=True)

            for img_idx, img in enumerate(img_list):
                xref = img[0]
                base_img = doc.extract_image(xref)

                if base_img:
                    image_info = {
                        "page": page_num + 1,
                        "image_index": img_idx,
                        "width": base_img.get("width", 0),
                        "height": base_img.get("height", 0),
                        "ext": base_img.get("ext", "png"),
                        "size": base_img.get("size", 0),
                    }
                    images.append(image_info)

        return images

    def extract_outline(self) -> List[Dict[str, Any]]:
        """提取目录/大纲

        返回:
            大纲条目列表
        """
        doc = self._load_document()
        outline = []

        try:
            toc = doc.get_toc()
            for level, title, page_num in toc:
                outline.append(
                    {
                        "level": level,
                        "title": title,
                        "page": page_num,
                    }
                )
        except Exception:
            pass

        return outline

    def close(self):
        """关闭文档，释放资源"""
        if self._doc is not None:
            self._doc.close()
            self._doc = None
            self._text_content = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False


def create_pdf_document(
    file_path: str,
    chunk_strategy: str = "paragraph",
    chunk_size: int = 500,
    chunk_overlap: int = 50,
) -> PDFDocument:
    """PDF 文档工厂函数

    Args:
        file_path: PDF 文件路径
        chunk_strategy: 分块策略
        chunk_size: 分块大小
        chunk_overlap: 重叠大小

    Returns:
        PDFDocument 实例
    """
    config = ChunkConfig(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    return PDFDocument(
        file_path=file_path,
        chunk_config=config,
        chunk_strategy=chunk_strategy,
    )
