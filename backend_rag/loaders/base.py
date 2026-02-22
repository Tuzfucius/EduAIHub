from abc import ABC, abstractmethod
from typing import List

class DocumentChunk:
    def __init__(self, content: str, metadata: dict):
        self.content = content
        self.metadata = metadata

class BaseLoader(ABC):
    """
    Abstract Base Class for all document loaders.
    Ensures modularity and extensibility for new file formats.
    """
    
    @abstractmethod
    def load(self, file_path: str) -> List[DocumentChunk]:
        """
        Parses the document and returns a list of DocumentChunks.
        """
        pass
