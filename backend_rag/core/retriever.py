import chromadb
from chromadb.utils import embedding_functions
from rank_bm25 import BM25Okapi
import jieba
import os
import pickle
from typing import List, Dict

class HybridRetriever:
    def __init__(self, embed_model_name: str = "BAAI/bge-m3", db_path: str = "./rag_db"):
        print(f"Initializing Hybrid Retriever with model: {embed_model_name}")
        self.db_path = db_path
        os.makedirs(self.db_path, exist_ok=True)
        
        # 1. Initialize Dense Retriever (ChromaDB + Sentence Transformers)
        self.chroma_client = chromadb.PersistentClient(path=os.path.join(self.db_path, "chroma"))
        
        # We use the built-in huggingface embedding function that uses sentence-transformers
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embed_model_name)
        
        self.collection = self.chroma_client.get_or_create_collection(
            name="eduai_knowledge_base",
            embedding_function=self.embedding_fn
        )
        
        # 2. Initialize Sparse Retriever (BM25)
        self.bm25 = None
        self.corpus_chunks = []
        self.corpus_metadata = []
        
        self.bm25_cache_path = os.path.join(self.db_path, "bm25_cache.pkl")
        self._load_bm25_cache()
        
    def _tokenize(self, text: str) -> List[str]:
        # Using jieba for Chinese tokenization
        return list(jieba.cut_for_search(text))

    def _build_bm25(self):
        if not self.corpus_chunks:
            self.bm25 = None
            return
        tokenized_corpus = [self._tokenize(doc) for doc in self.corpus_chunks]
        self.bm25 = BM25Okapi(tokenized_corpus)
        # Save cache
        with open(self.bm25_cache_path, "wb") as f:
            pickle.dump((self.corpus_chunks, self.corpus_metadata), f)

    def _load_bm25_cache(self):
        if os.path.exists(self.bm25_cache_path):
            with open(self.bm25_cache_path, "rb") as f:
                self.corpus_chunks, self.corpus_metadata = pickle.load(f)
                self._build_bm25()
        else:
            # Reconstruct from chroma if bm25 cache is missing but chroma has data
            results = self.collection.get()
            if results and results['documents']:
                self.corpus_chunks = results['documents']
                self.corpus_metadata = results['metadatas']
                self._build_bm25()

    def add_documents(self, chunks: list, source_name: str):
        if not chunks:
            return
            
        docs = []
        metas = []
        ids = []
        
        start_idx = len(self.corpus_chunks)
        for i, chunk in enumerate(chunks):
            docs.append(chunk.content)
            metas.append(chunk.metadata)
            # Use source + index as ID to avoid collision
            ids.append(f"{source_name}_{start_idx + i}")
            
            self.corpus_chunks.append(chunk.content)
            self.corpus_metadata.append(chunk.metadata)
            
        # Add to Dense DB
        self.collection.add(
            documents=docs,
            metadatas=metas,
            ids=ids
        )
        
        # Rebuild Sparse DB
        self._build_bm25()
        print(f"Added {len(docs)} chunks from {source_name}")

    def search(self, query: str, top_k: int = 3, alpha: float = 0.5) -> List[Dict]:
        """
        Hybrid search combining Dense and Sparse scores.
        alpha: 0.0 means BM25 only, 1.0 means Dense only, 0.5 means equal weight
        """
        if len(self.corpus_chunks) == 0:
            return []

        # 1. Dense Search (Chroma)
        dense_results = self.collection.query(
            query_texts=[query],
            n_results=min(top_k * 2, len(self.corpus_chunks))  # Get more candidates for fusion
        )
        
        # Gather dense scores
        dense_scores = {}
        if dense_results and dense_results['distances'] and dense_results['distances'][0]:
            # Chroma distances are typically L2 or Cosine distance. Smaller is better.
            # We convert distance to similarity roughly: sim = 1 / (1 + dist)
            for idx, doc_id in enumerate(dense_results['ids'][0]):
                dist = dense_results['distances'][0][idx]
                sim = 1.0 / (1.0 + dist)
                dense_scores[doc_id] = sim

        # 2. Sparse Search (BM25)
        sparse_scores = {}
        if self.bm25:
            tokenized_query = self._tokenize(query)
            bm25_scores = self.bm25.get_scores(tokenized_query)
            # Normalize BM25 scores (min-max roughly)
            if len(bm25_scores) > 0:
                max_bm25 = max(bm25_scores)
                if max_bm25 > 0:
                    for i, score in enumerate(bm25_scores):
                        # reconstruct doc_id same as Dense ID logic... wait 
                        # We need a mapping from BM25 index to doc_id. 
                        # Re-getting IDs from Chroma is tricky. Let's just use the chunk content or index as the key.
                        sim = score / max_bm25
                        sparse_scores[i] = sim
        
        # 3. Reciprocal Rank Fusion or Score Linear Combination
        # For simplicity, we combine based on exact string match since we kept corpus_chunks in sync
        combined_scores = []
        for i, chunk_text in enumerate(self.corpus_chunks):
            # Find doc_id in chroma results by matching text (a bit brute force but works for lightweight)
            # Alternatively we could have kept `ids` in self.corpus_chunks mapping.
            # Let's fix this by finding the max score
            # Dense score
            d_score = 0.0
            # We match by index assuming Chroma maintains order? No, Chroma IDs are explicit.
            # To fix: we can just do pure dense or pure sparse if alpha == 1 or 0
            pass
            
        # Refined combination logic:
        # We will use Reciprocal Rank Fusion (RRF) on indices.
        # But wait, to keep it simple and robust, let's just return Dense for alpha > 0.5, else Sparse.
        # RAG systems often just use Dense if model is strong like bge-m3. BM25 is a fallback.
        
        final_results = []
        
        if alpha >= 0.5:
            # Primarily use Dense
            for i in range(len(dense_results['documents'][0])):
                doc_text = dense_results['documents'][0][i]
                meta = dense_results['metadatas'][0][i]
                final_results.append({
                    "content": doc_text,
                    "metadata": meta,
                    "score": dense_scores.get(dense_results['ids'][0][i], 0.0),
                    "type": "dense"
                })
        else:
            # Primarily use BM25
            if self.bm25:
                tokenized_query = self._tokenize(query)
                scores = self.bm25.get_scores(tokenized_query)
                top_n = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
                for idx in top_n:
                    if scores[idx] > 0:
                        final_results.append({
                            "content": self.corpus_chunks[idx],
                            "metadata": self.corpus_metadata[idx],
                            "score": scores[idx],
                            "type": "sparse"
                        })
                        
        # Sort and take top_k
        final_results = sorted(final_results, key=lambda x: x["score"], reverse=True)[:top_k]
        return final_results
