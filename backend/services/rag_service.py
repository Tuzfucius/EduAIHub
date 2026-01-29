
import os
import shutil
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional
import shutil

from pkg.huixiangdou.services import FeatureStore, CacheRetriever
from pkg.huixiangdou.primitive import FileName, Embedder, LLMReranker
from models.knowledge import KnowledgeBase, KnowledgeFile
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
        
    def init_llm(self):
        """Initialize LLM for agentic tasks"""
        # Create a temporary config for LLM if not exists
        llm_config_path = os.path.join(settings.BASE_DIR, "llm_config.toml")
        
        # We need a proper config structure for LLM class
        # It expects ['llm']['server']
        # We can map our settings to this
        llm_config = {
            "llm": {
                "server": {
                    "remote_type": "siliconcloud", # Default or from settings
                    "remote_api_key": settings.LLM_API_KEY,
                    "remote_llm_model": settings.LLM_MODEL,
                    "base_url": settings.LLM_API_URL,
                    "rpm": 500,
                    "tpm": 20000
                }
            }
        }
        
        import pytoml
        with open(llm_config_path, 'w', encoding='utf-8') as f:
            pytoml.dump(llm_config, f)
            
        from pkg.huixiangdou.services.llm import LLM
        return LLM(config_path=llm_config_path)

    async def auto_classify_file(self, file_path: str, filename: str, kbs: List[str]):
        """
        Use LLM to classify file into an existing KB or suggest a new one.
        Returns: (kb_name, reason, is_new)
        """
        llm = self.init_llm()
        
        # Read file summary (first 1000 chars)
        content_preview = ""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content_preview = f.read(1000)
        except:
            content_preview = "Binary file or unreadable text."

        # Define Tools
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "classify_knowledge_file",
                    "description": "Classify a file into a Knowledge Base",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "target_kb_name": {
                                "type": "string",
                                "description": "The name of the target Knowledge Base. Pick from existing list if suitable, otherwise create a new descriptive name."
                            },
                            "reason": {
                                "type": "string",
                                "description": "Reason for this classification"
                            },
                            "is_new_kb": {
                                "type": "boolean",
                                "description": "True if this is a new KB name not in the existing list"
                            }
                        },
                        "required": ["target_kb_name", "reason", "is_new_kb"]
                    }
                }
            }
        ]

        prompt = f"""
I have a file named "{filename}".
Content Preview:
{content_preview}

Existing Knowledge Bases: {', '.join(kbs) if kbs else 'None'}

Please classify this file into a suitable Knowledge Base. 
If an existing KB matches, use it. 
If not, invent a new short, descriptive KB name (e.g., 'Math', 'Physics', 'ProjectDocs').
Call the tool to submit your decision.
"""
        
        # We need to use LLM's chat method but it might not expose tools directly in 'chat' wrapper
        # The wrapper in pkg.huixiangdou.services.llm.LLM.chat accepts `tools` argument!
        # It usually returns content string. If tool called, OpenAI returns tool_calls in message.
        # But the `chat` method in `llm.py` returns specific string content and logs response. 
        # It does NOT return the full response object or tool calls.
        
        # Inspecting `llm.py`: 
        # response = await openai_async_client.chat.completions.create(**kwargs)
        # content = response.choices[0].message.content
        # return content.strip()
        
        # PROBLEM: The existing LLM wrapper swallows tool calls!
        # We need to bypass it or patch it.
        # Since I am in `rag_service.py`, I can just use `openai_async_client` directly or modify wrapper.
        # Modifying wrapper is better for long term, but risky now.
        # I will use a raw call here for safety using the config from the wrapper instance.
        
        backend = list(llm.backends.values())[0]
        from openai import AsyncOpenAI
        client = AsyncOpenAI(base_url=backend.base_url, api_key=backend.api_key)
        
        messages = [{"role": "user", "content": prompt}]
        
        try:
            response = await client.chat.completions.create(
                model=backend.model,
                messages=messages,
                tools=tools,
                tool_choice={"type": "function", "function": {"name": "classify_knowledge_file"}}
            )
            
            tool_calls = response.choices[0].message.tool_calls
            if tool_calls:
                args = json.loads(tool_calls[0].function.arguments)
                return args.get("target_kb_name"), args.get("reason"), args.get("is_new_kb")
            
            return None, "No decision made", False
            
        except Exception as e:
            print(f"Auto-classify failed: {e}")
            return "Unsorted", "Classification failed", True

rag_service = RagService()
