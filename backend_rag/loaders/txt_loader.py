from typing import List
from .base import BaseLoader, DocumentChunk

class TxtLoader(BaseLoader):
    def load(self, file_path: str) -> List[DocumentChunk]:
        chunks = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Split by double newlines to paragraph level roughly
            paragraphs = content.split('\n\n')
            
            chunk_text = ""
            # Simple chunking strategy for txt
            for i, p in enumerate(paragraphs):
                p = p.strip()
                if not p:
                    continue
                chunk_text += p + "\n\n"
                # If chunk exceeds ~500 chars, make it a new chunk
                if len(chunk_text) > 500 or i == len(paragraphs) - 1:
                    chunks.append(DocumentChunk(
                        content=chunk_text.strip(),
                        metadata={"source": file_path}
                    ))
                    chunk_text = ""
        except Exception as e:
            print(f"Error loading TXT {file_path}: {e}")
            
        return chunks
