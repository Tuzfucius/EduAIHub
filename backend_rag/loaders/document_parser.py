import os
from typing import List
from .base import DocumentChunk
from .pdf_loader import PDFLoader
from .docx_loader import DocxLoader
from .txt_loader import TxtLoader

def process_file(file_path: str) -> List[DocumentChunk]:
    """
    Factory method to parse a file based on its extension using modular loaders.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    loader = None
    if ext == '.pdf':
        loader = PDFLoader()
    elif ext == '.docx':
        loader = DocxLoader()
    elif ext in ['.txt', '.md', '.csv']:
        loader = TxtLoader()
    else:
        print(f"Unsupported file extension: {ext}")
        return []
        
    chunks = loader.load(file_path)
    # Could add global post-processing here (e.g. forced overlap)
    return chunks
