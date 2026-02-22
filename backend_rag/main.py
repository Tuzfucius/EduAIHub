import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
import pydantic

from core.retriever import HybridRetriever
from loaders.document_parser import process_file

app = FastAPI(title="EduAIHub Local RAG Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singleton for our hybrid retriever
retriever: Optional[HybridRetriever] = None

@app.on_event("startup")
async def startup_event():
    global retriever
    # Initialize the hybrid retriever with a local embedding model
    print("Loading RAG Retriever... (This may take a moment to load embedding weights)")
    retriever = HybridRetriever(
        embed_model_name="BAAI/bge-m3", 
        db_path="./rag_db"
    )
    print("RAG Retriever initialized.")

@app.get("/health")
def health_check():
    return {"status": "ok", "ready": retriever is not None}

@app.post("/api/v1/rag/upload")
async def upload_document(file: UploadFile = File(...), bg_tasks: BackgroundTasks = BackgroundTasks()):
    """
    Streamlines document parsing and immediate addition to local DB
    """
    if not retriever:
        raise HTTPException(status_code=500, detail="Retriever not initialized")
    
    # Save file temporarily
    os.makedirs("./temp_uploads", exist_ok=True)
    file_path = f"./temp_uploads/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    def process_and_add():
        chunks = process_file(file_path)
        if chunks:
            # We add documents implicitly as dictionaries or objects
            retriever.add_documents(chunks, source_name=file.filename)
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
            
    bg_tasks.add_task(process_and_add)
    return {"status": "processing", "filename": file.filename, "message": "Document is being parsed and vectorized in the background."}

class QueryRequest(pydantic.BaseModel):
    query: str
    top_k: int = 3
    alpha: float = 0.5 # 0.0 pure dense, 1.0 pure sparse

@app.post("/api/v1/rag/query")
async def query_knowledge(req: QueryRequest):
    if not retriever:
        raise HTTPException(status_code=500, detail="Retriever not initialized")
    
    results = retriever.search(req.query, top_k=req.top_k, alpha=req.alpha)
    return {"status": "success", "data": results}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8500)
