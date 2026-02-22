import docx
from typing import List
from .base import BaseLoader, DocumentChunk

class DocxLoader(BaseLoader):
    def load(self, file_path: str) -> List[DocumentChunk]:
        chunks = []
        try:
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    full_text.append(text)
            
            # For simplicity, split word docs by larger chunks (e.g. 5 paragraphs)
            chunk_text = ""
            for i, p in enumerate(full_text):
                chunk_text += p + "\n"
                if (i + 1) % 5 == 0 or i == len(full_text) - 1:
                    chunks.append(DocumentChunk(
                        content=chunk_text.strip(),
                        metadata={"source": file_path, "chunk_group": (i // 5) + 1}
                    ))
                    chunk_text = ""
        except Exception as e:
            print(f"Error loading DOCX {file_path}: {e}")
            
        return chunks
