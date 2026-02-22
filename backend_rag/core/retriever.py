import chromadb
from chromadb.utils import embedding_functions
from rank_bm25 import BM25Okapi
import jieba
import os
import pickle
import shutil
from typing import List, Dict, Optional

class HybridRetriever:
    def __init__(self, embed_model_name: str = "BAAI/bge-m3", db_path: str = "./rag_db"):
        print(f"Initializing Hybrid Retriever with model: {embed_model_name}")
        self.db_path = db_path
        self.embed_model_name = embed_model_name
        os.makedirs(self.db_path, exist_ok=True)
        
        # 1. Initialize Dense Retriever (ChromaDB + Sentence Transformers)
        self.chroma_client = chromadb.PersistentClient(path=os.path.join(self.db_path, "chroma"))
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=self.embed_model_name)
        
        # 2. Setup Sparse variables
        self.bm25_dict = {}  # { collection_name: BM25Okapi }
        self.corpus_chunks = {} # { collection_name: [chunks] }
        self.corpus_metadata = {} # { collection_name: [metadata] }
        
        self.bm25_cache_dir = os.path.join(self.db_path, "bm25_caches")
        os.makedirs(self.bm25_cache_dir, exist_ok=True)
        self._load_all_bm25_caches()
        
    def reset_database(self, new_model_name: str):
        """
        Wipes the entire database to switch the embedding model.
        """
        print(f"Wiping DB and switching model to {new_model_name}...")
        self.embed_model_name = new_model_name
        self.bm25_dict.clear()
        self.corpus_chunks.clear()
        self.corpus_metadata.clear()
        
        # Close chroma if possible, then rmtree
        shutil.rmtree(self.db_path, ignore_errors=True)
        
        os.makedirs(self.db_path, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=os.path.join(self.db_path, "chroma"))
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=self.embed_model_name)
        self.bm25_cache_dir = os.path.join(self.db_path, "bm25_caches")
        os.makedirs(self.bm25_cache_dir, exist_ok=True)

    def _tokenize(self, text: str) -> List[str]:
        return list(jieba.cut_for_search(text))

    def _build_bm25(self, collection_name: str):
        chunks = self.corpus_chunks.get(collection_name, [])
        if not chunks:
            self.bm25_dict[collection_name] = None
            return
        tokenized_corpus = [self._tokenize(doc) for doc in chunks]
        self.bm25_dict[collection_name] = BM25Okapi(tokenized_corpus)
        
        # Save cache
        cache_path = os.path.join(self.bm25_cache_dir, f"{collection_name}.pkl")
        with open(cache_path, "wb") as f:
            pickle.dump((self.corpus_chunks[collection_name], self.corpus_metadata[collection_name]), f)

    def _load_all_bm25_caches(self):
        try:
            collections = self.chroma_client.list_collections()
            for c in collections:
                self._load_bm25(c.name)
        except Exception as e:
            print("Error loading bm25 caches:", e)

    def _load_bm25(self, collection_name: str):
        cache_path = os.path.join(self.bm25_cache_dir, f"{collection_name}.pkl")
        if os.path.exists(cache_path):
            with open(cache_path, "rb") as f:
                self.corpus_chunks[collection_name], self.corpus_metadata[collection_name] = pickle.load(f)
                self._build_bm25(collection_name)
        else:
            try:
                coll = self.chroma_client.get_collection(name=collection_name, embedding_function=self.embedding_fn)
                results = coll.get()
                if results and results['documents']:
                    self.corpus_chunks[collection_name] = results['documents']
                    self.corpus_metadata[collection_name] = results['metadatas']
                    self._build_bm25(collection_name)
                else:
                    self.corpus_chunks[collection_name] = []
                    self.corpus_metadata[collection_name] = []
            except Exception:
                pass

    def get_collections(self) -> List[Dict]:
        try:
            collections = self.chroma_client.list_collections()
            res = []
            for c in collections:
                count = c.count()
                res.append({"name": c.name, "count": count})
            return res
        except Exception as e:
            print(e)
            return []

    def get_collection_files(self, name: str) -> List[Dict]:
        if name not in self.corpus_metadata:
            return []
        
        file_stats = {}
        for meta in self.corpus_metadata[name]:
            if not meta: continue
            src = meta.get("source", "Unknown")
            if src not in file_stats:
                file_stats[src] = 1
            else:
                file_stats[src] += 1
                
        # Return list of files with their chunk counts
        files = []
        for src, chunks in file_stats.items():
            files.append({"filename": src, "chunks": chunks})
        return files

    def create_collection(self, name: str):
        self.chroma_client.get_or_create_collection(name=name, embedding_function=self.embedding_fn)
        if name not in self.corpus_chunks:
            self.corpus_chunks[name] = []
            self.corpus_metadata[name] = []

    def delete_collection(self, name: str):
        try:
            self.chroma_client.delete_collection(name=name)
        except Exception:
            pass
        self.bm25_dict.pop(name, None)
        self.corpus_chunks.pop(name, None)
        self.corpus_metadata.pop(name, None)
        cache_path = os.path.join(self.bm25_cache_dir, f"{name}.pkl")
        if os.path.exists(cache_path):
            os.remove(cache_path)

    def add_documents(self, chunks: list, source_name: str, collection_name: str = "default"):
        if not chunks:
            return
            
        coll = self.chroma_client.get_or_create_collection(name=collection_name, embedding_function=self.embedding_fn)
        
        if collection_name not in self.corpus_chunks:
            self.corpus_chunks[collection_name] = []
            self.corpus_metadata[collection_name] = []
            
        docs = []
        metas = []
        ids = []
        
        start_idx = len(self.corpus_chunks[collection_name])
        for i, chunk in enumerate(chunks):
            docs.append(chunk.content)
            metas.append(chunk.metadata)
            ids.append(f"{collection_name}_{source_name}_{start_idx + i}")
            
            self.corpus_chunks[collection_name].append(chunk.content)
            self.corpus_metadata[collection_name].append(chunk.metadata)
            
        coll.add(documents=docs, metadatas=metas, ids=ids)
        self._build_bm25(collection_name)
        print(f"Added {len(docs)} chunks to {collection_name}")

    def search(self, query: str, top_k: int = 3, alpha: float = 0.5, collection_name: str = "default") -> List[Dict]:
        try:
            coll = self.chroma_client.get_collection(name=collection_name, embedding_function=self.embedding_fn)
        except Exception:
            return []
            
        chunks = self.corpus_chunks.get(collection_name, [])
        if len(chunks) == 0:
            return []

        # 1. Dense Search (Chroma)
        dense_results = coll.query(
            query_texts=[query],
            n_results=min(top_k * 2, len(chunks))
        )
        
        dense_scores = {}
        if dense_results and dense_results['distances'] and dense_results['distances'][0]:
            for idx, doc_id in enumerate(dense_results['ids'][0]):
                dist = dense_results['distances'][0][idx]
                sim = 1.0 / (1.0 + dist)
                dense_scores[doc_id] = sim

        # 2. Sparse Search (BM25)
        sparse_scores = {}
        bm25_inst = self.bm25_dict.get(collection_name)
        if bm25_inst:
            tokenized_query = self._tokenize(query)
            bm25_scores = bm25_inst.get_scores(tokenized_query)
            if len(bm25_scores) > 0:
                max_bm25 = max(bm25_scores)
                if max_bm25 > 0:
                    for i, score in enumerate(bm25_scores):
                        sim = score / max_bm25
                        sparse_scores[i] = sim
        
        final_results = []
        
        if alpha >= 0.5:
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
            if bm25_inst:
                tokenized_query = self._tokenize(query)
                scores = bm25_inst.get_scores(tokenized_query)
                top_n = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
                for idx in top_n:
                    if scores[idx] > 0:
                        final_results.append({
                            "content": chunks[idx],
                            "metadata": self.corpus_metadata[collection_name][idx],
                            "score": scores[idx],
                            "type": "sparse"
                        })
                        
        final_results = sorted(final_results, key=lambda x: x["score"], reverse=True)[:top_k]
        return final_results
