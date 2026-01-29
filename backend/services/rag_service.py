
import os
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional
import shutil

from backend.pkg.huixiangdou.services import FeatureStore, CacheRetriever
from backend.pkg.huixiangdou.primitive import FileName, Embedder, LLMReranker
from backend.models.knowledge import KnowledgeBase, KnowledgeFile
from config import settings

# Global Cache Retriever Instance
# To avoid reloading models, we keep a singleton or managed instance.
# HuixiangDou CacheRetriever handles LRU caching internally.

class RagService:
    def __init__(self):
        # Ensure we have a config object for HuixiangDou
        # For now we might need to generate a temporary config.ini or mock it
        self.executor = ThreadPoolExecutor(max_workers=2)
        
        # We need a base config for shared settings (like embedding API key)
        self.base_config = {
            "feature_store": {
                "reject_throttle": 0.2,
                "embedding_model_path": settings.EMBEDDING_API_URL or "https://api.siliconflow.cn/v1/embeddings",
                "reranker_model_path": "BAAI/bge-reranker-v2-m3", # logical name for API
                "api_token": settings.EMBEDDING_API_KEY,  # User needs to set this
                "api_rpm": 500,
                "api_tpm": 20000
            }
        }
        
        # Create a dummy config path because HuixiangDou expects a file path
        self.config_path = os.path.join(settings.BASE_DIR, "rag_config.toml")
        import pytoml
        with open(self.config_path, 'w', encoding='utf-8') as f:
            pytoml.dump(self.base_config, f)
            
        self.cache = CacheRetriever(config_path=self.config_path)

    async def build_kb_index(self, kb: KnowledgeBase, files: List[KnowledgeFile]):
        """Build/Rebuild index for a Knowledge Base"""
        
        # 1. Prepare file list for HuixiangDou
        # FilePath needs to be FileName object
        # HuixiangDou uses FileName class: origin, copypath, _type
        
        target_files = []
        work_dir = kb.work_dir
        
        # Ensure workdirs exist
        os.makedirs(work_dir, exist_ok=True)
        
        for f in files:
            # We assume file_path is the absolute path where we saved the uploaded file
            # or we need to copy it to a repodir-like structure?
            # HuixiangDou preprocess copies file to work_dir/preprocess.
            
            # Determine type
            ext = os.path.splitext(f.filename)[1].lower().replace('.', '')
            if ext in ['pdf', 'doc', 'docx']:
                ftype = 'pdf' if ext == 'pdf' else 'word'
            elif ext in ['md', 'txt']:
                ftype = 'text' if ext == 'txt' else 'md'
            elif ext in ['jpg', 'png']:
                ftype = 'image'
            else:
                ftype = 'text' # default
                
            fn = FileName(root=os.path.dirname(f.file_path), filename=os.path.basename(f.file_path), _type=ftype)
            target_files.append(fn)

        # 2. Run FeatureStore initialization in thread pool
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            self.executor, 
            self._sync_build, 
            self.cache.embedder, 
            self.config_path, 
            target_files, 
            work_dir
        )
        
        # 3. Mark KB as ready
        return True

    def _sync_build(self, embedder, config_path, files, work_dir):
        """Synchronous build function to run in thread"""
        fs = FeatureStore(embedder=embedder, config_path=config_path)
        
        # Mock InitializeConfig
        class MockConfig:
            def __init__(self, files, work_dir):
                self.files = files
                self.work_dir = work_dir
                self.ner_file = None
                self.qa_pair_file = None
        
        conf = MockConfig(files, work_dir)
        try:
            fs.initialize(config=conf)
            return True
        except Exception as e:
            print(f"Build Failed: {e}")
            raise e

    async def query_kb(self, kb: KnowledgeBase, question: str):
        """Query Knowledge Base"""
        loop = asyncio.get_running_loop()
        
        # Get retriever from cache
        # fs_id should be unique str for the KB
        fs_id = f"kb_{kb.id}"
        
        result = await loop.run_in_executor(
            self.executor,
            self._sync_query,
            fs_id,
            self.config_path,
            kb.work_dir,
            question
        )
        return result

    def _sync_query(self, fs_id, config_path, work_dir, question):
        retriever = self.cache.get(fs_id=fs_id, config_path=config_path, work_dir=work_dir)
        
        # HuixiangDou query returns: splits, context, refs, ref_texts
        # But we want specific structured data
        
        # First check is_relative (Rejection pipeline)
        # relative, score = retriever.is_relative(question)
        # if not relative:
        #     return {"rejected": True, "answer": "I cannot answer this based on the knowledge base.", "references": []}
            
        # Run Query (Pipeline)
        chunks, context, refs, ref_texts = retriever.query(query=question)
        
        if not chunks and not context:
             return {"rejected": True, "answer": "未在知识库中找到相关内容。", "references": []}
        
        # Format references
        formatted_refs = []
        for i, r in enumerate(refs):
            formatted_refs.append({
                "filename": r,
                "content": ref_texts[i] if i < len(ref_texts) else "",
                "score": 0.0 # TODO: extract score if available
            })
            
        return {
            "rejected": False,
            "answer": "", # The pure retriever doesn't generate answer, it returns context. We need to pass this context to LLM separately or here.
            "context": context,
            "references": formatted_refs
        }
        
rag_service = RagService()
