import os
import asyncio
from typing import Dict, Any, List
from huggingface_hub import snapshot_download

# Define a cache directory for our downloaded models
HF_CACHE_DIR = os.environ.get("HF_HOME", os.path.expanduser("~/.cache/huggingface/hub"))

# Hardcode some recommended models for the UI
RECOMMENDED_MODELS = [
    {
        "id": "BAAI/bge-m3",
        "name": "BGE M3 (Multilingual)",
        "description": "Excellent multilingual and cross-lingual retrieval model. Supports dense, sparse, and multi-vector.",
        "tags": ["Multilingual", "State-of-the-Art"],
        "size_estimate": "2.2 GB"
    },
    {
        "id": "BAAI/bge-large-zh-v1.5",
        "name": "BGE Large ZH v1.5",
        "description": "Powerful model specially optimized for Chinese language retrieval tasks.",
        "tags": ["Chinese", "Large"],
        "size_estimate": "1.3 GB"
    },
    {
        "id": "nomic-ai/nomic-embed-text-v1.5",
        "name": "Nomic Embed Text v1.5",
        "description": "High performance English model with exceptionally long context window (8192 tokens).",
        "tags": ["English", "Long Context"],
        "size_estimate": "550 MB"
    },
    {
        "id": "BAAI/bge-small-zh-v1.5",
        "name": "BGE Small ZH v1.5",
        "description": "Fast and lightweight Chinese embedding model suitable for resource-constrained environments.",
        "tags": ["Chinese", "Fast", "Small"],
        "size_estimate": "95 MB"
    }
]

# Track active downloads globally
# Key: model_id, Value: generator yielding progress dicts or a final state dict
active_downloads: Dict[str, Dict[str, Any]] = {}

def get_installed_models() -> List[str]:
    """
    Scans the huggingface cache directory to find models that have been downloaded.
    Huggingface usually stores them as `models--<org>--<name>`.
    """
    installed = []
    if not os.path.exists(HF_CACHE_DIR):
        return installed
        
    for entry in os.listdir(HF_CACHE_DIR):
        if entry.startswith("models--"):
            # Format: models--BAAI--bge-m3
            parts = entry.split("--")
            if len(parts) >= 3:
                org = parts[1]
                name = "--".join(parts[2:])
                installed.append(f"{org}/{name}")
                
    return installed

async def download_model_task(model_id: str):
    """
    Background asyncio task to download a model from Huggingface using snapshot_download.
    We intercept progress/completion to update our global state.
    """
    active_downloads[model_id] = {
        "status": "downloading",
        "message": "Initializing download...",
        "progress": 0
    }
    
    try:
        # Tqdm patching or tracking is notoriously hard with pure huggingface_hub inside asyncio
        # For simplicity in this local MVP, we will trigger snapshot_download synchronously in a thread
        # and just report "downloading" -> "completed". 
        # (In a true prod app, we'd pipe the HF tqdm bar into our SSE stream)
        
        loop = asyncio.get_event_loop()
        def _download():
            # Use huggingface snapshot download. It uses cache automatically.
            return snapshot_download(repo_id=model_id, resume_download=True, local_files_only=False)
            
        active_downloads[model_id]["message"] = "Downloading shards from HuggingFace..."
        active_downloads[model_id]["progress"] = 10
        
        path = await loop.run_in_executor(None, _download)
        
        active_downloads[model_id] = {
            "status": "completed",
            "message": "Download finished successfully",
            "progress": 100,
            "path": path
        }
        
    except Exception as e:
        active_downloads[model_id] = {
            "status": "failed",
            "message": str(e),
            "progress": 0
        }
        
def get_download_status(model_id: str) -> Dict[str, Any]:
    """
    Returns the current known status of a download.
    """
    if model_id in active_downloads:
        return active_downloads[model_id]
        
    installed = get_installed_models()
    if model_id in installed:
        return {"status": "completed", "message": "Model is already cached locally", "progress": 100}
        
    return {"status": "pending", "message": "Not downloaded", "progress": 0}

