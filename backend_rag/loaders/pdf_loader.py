import fitz  # PyMuPDF
from typing import List
from .base import BaseLoader, DocumentChunk

class PDFLoader(BaseLoader):
    def load(self, file_path: str) -> List[DocumentChunk]:
        chunks = []
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text("text")
                if text.strip():
                    chunks.append(DocumentChunk(
                        content=text.strip(),
                        metadata={"source": file_path, "page": page_num + 1}
                    ))
        except Exception as e:
            print(f"Error loading PDF {file_path}: {e}")
            
        return chunks
