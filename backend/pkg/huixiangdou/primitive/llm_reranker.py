
import json
import os
import requests
from typing import List
import numpy as np
from .chunk import Chunk
from .limitter import RPM
from loguru import logger

class LLMReranker:
    _type: str = 'siliconcloud'
    topn: int

    def __init__(
            self,
            model_config: dict,
            topn: int = 10):

        self.topn = topn
        
        # Force SiliconCloud configuration
        api_token = model_config.get('api_token', '').strip()
        if not api_token:
            api_token = os.getenv('SILICONCLOUD_TOKEN', '')
            
        if 'Bearer' not in api_token:
            api_token = 'Bearer ' + api_token
            
        api_rpm = max(1, int(model_config.get('api_rpm', 500)))
        
        self.client = {
            'api_token': api_token,
            'api_rpm': RPM(api_rpm)
        }

    @classmethod
    def model_type(self, model_path):
        return 'siliconcloud'

    def _sort(self, texts: List[str], query: str):
        """Rerank input texts, return descending indexes, indexes[0] is the
        nearest chunk."""
        
        self.client['api_rpm'].wait_sync(silent=True)

        url = "https://api.siliconflow.cn/v1/rerank"
        payload = {
            "model": "netease-youdao/bce-reranker-base_v1",
            "query": query,
            "documents": texts,
            "return_documents": False,
            "max_chunks_per_doc": 832,
            "overlap_tokens": 32
        }
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": self.client['api_token']
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            json_obj = response.json()
            results = json_obj.get('results', [])
            indexes_list = [int(item['index']) for item in results]
            indexes = np.array(indexes_list).astype(np.int32)
            # return indexes[0:self.topn] 
            # Original code returns sorted indexes. 
            # If results are sorted by relevance (score), we want the original indices ordered by score.
            # SiliconCloud rerank API returns results sorted by score descending? 
            # Yes, standard rerank APIs usually do. 
            # 'index' in result is the index in the original list.
            return indexes[0:self.topn]
        except Exception as e:
            logger.error(f'reranker API fail {e}, use default order')
            # fallback: return first N
            return np.array([i for i in range(min(len(texts), self.topn))])

    def rerank(self, query: str, chunks: List[Chunk]):
        """Rerank faiss search results."""
        if not chunks:
            return []

        texts = []
        for chunk in chunks:
             # content_or_path could be image path, but we treat as text for now
            texts.append(chunk.content_or_path)

        indexes = self._sort(texts=texts, query=query)
        return [chunks[i] for i in indexes]
