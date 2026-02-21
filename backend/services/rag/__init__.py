"""
RAG 模块初始化

模块化、可扩展的 RAG 架构。

结构:
├── documents/      # 文档解析层
│   ├── base.py     # 文档抽象基类
│   ├── chunker.py  # 文本分块策略
│   └── pdf_parser.py  # PDF 解析器
├── embeddings/     # 嵌入层
│   ├── base.py     # 嵌入抽象基类
│   └── openai_style.py  # OpenAI 兼容 API
├── vector_stores/  # 向量存储层
│   ├── base.py     # 向量存储抽象基类
│   └── faiss_store.py  # FAISS 实现
├── retrievers/     # 检索层
│   └── simple_retriever.py  # 简单检索器
├── qa/             # 问答层
│   └── simple_qa.py  # 简单问答服务
└── config.py       # 配置管理
"""

from .config import RagConfig, rag_config

from .documents import (
    BaseDocument,
    DocumentChunk,
    DocumentMetadata,
    PDFDocument,
    create_pdf_document,
    BaseChunker,
    ChunkConfig,
    create_chunker,
)

from .embeddings import (
    BaseEmbedding,
    DummyEmbedding,
    OpenAICompatibleEmbedding,
    create_embedding,
)

from .vector_stores import (
    BaseVectorStore,
    SearchResult,
    FAISSStore,
    create_faiss_store,
)

from .retrievers import (
    SimpleRetriever,
    RetrievalResult,
)

from .qa import (
    SimpleQA,
    create_qa,
)

__all__ = [
    # Config
    "RagConfig",
    "rag_config",
    # Documents
    "BaseDocument",
    "DocumentChunk",
    "DocumentMetadata",
    "PDFDocument",
    "create_pdf_document",
    "BaseChunker",
    "ChunkConfig",
    "create_chunker",
    # Embeddings
    "BaseEmbedding",
    "DummyEmbedding",
    "OpenAICompatibleEmbedding",
    "create_embedding",
    # Vector Stores
    "BaseVectorStore",
    "SearchResult",
    "FAISSStore",
    "create_faiss_store",
    # Retrievers
    "SimpleRetriever",
    "RetrievalResult",
    # QA
    "SimpleQA",
    "create_qa",
]
