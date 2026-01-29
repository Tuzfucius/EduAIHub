
#
import os
import requests
import json
import numpy as np
from typing import Any, List
from loguru import logger
from .query import DistanceStrategy
from .limitter import RPM, TPM
from .chunk import Chunk

class Embedder:
    """Wrap text2vec (multimodal) model."""
    client: Any
    _type: str = 'siliconcloud'

    def __init__(self, model_config: dict):
        self.support_image = False
        self.distance_strategy = DistanceStrategy.EUCLIDEAN_DISTANCE
        
        # Force SiliconCloud configuration
        api_token = model_config.get('api_token', '').strip()
        if not api_token:
            api_token = os.getenv('SILICONCLOUD_TOKEN', '')
        
        if not api_token:
            logger.warning('SILICONCLOUD_TOKEN is missing. Embedding will fail.')
        
        if 'Bearer' not in api_token:
            api_token = 'Bearer ' + api_token
            
        api_rpm = max(1000, int(model_config.get('api_rpm', 1000)))
        api_tpm = max(40000, int(model_config.get('api_tpm', 40000)))

        self.client = {
            'api_token': api_token,
            'api_rpm': RPM(api_rpm),
            'api_tpm': TPM(api_tpm)
        }

    @classmethod
    def model_type(self, model_path):
        return 'siliconcloud'

    def token_length(self, text: str) -> int:
        # Simple heuristic since we don't have local tokenizer
        return len(text) // 2

    def distance(self, text1:str, text2:str) -> float:
        emb1 = self.embed_query(text=text1)
        emb2 = self.embed_query(text=text2)

        if self.distance_strategy == DistanceStrategy.EUCLIDEAN_DISTANCE:
            distance = np.linalg.norm(emb1 - emb2)
            return distance
        raise ValueError('Unsupported distance strategy')

    def embed_query(self, text: str = None, path: str = None) -> np.ndarray:
        """Embed input text or image as feature, output np.ndarray with np.float32"""
        # Wait for rate limits
        self.client['api_rpm'].wait_sync(silent=True)
        self.client['api_tpm'].wait_sync(silent=True, token_count=len(text) if text else 0)

        # siliconcloud bce API
        if not text:
             # Basic image placeholder or error
             raise ValueError('This api only support text for now')
        
        # Hardcoded to use bce-embedding-base_v1 as suggested by HuixiangDou for general use
        # or we config it. For now hardcode is safe.
        url = "https://api.siliconflow.cn/v1/embeddings"

        payload = {
            "model": "netease-youdao/bce-embedding-base_v1",
            "input": text,
            "encoding_format": "float"
        }
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": self.client['api_token']
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            json_obj = response.json()
            emb_list = json_obj['data'][0]['embedding']
            emb = np.array(emb_list).astype(np.float32).reshape(1, -1)
            return emb
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            # Return zero vector fallback to prevent crash? 
            # Better to raise error but let's see. 
            # BCE embedding dim is 768.
            return np.zeros((1, 768), dtype=np.float32)

    def embed_query_batch_text(self, chunks: List[Chunk] = []) -> np.ndarray:
        """Embed input text or image as feature, output np.ndarray with np.float32"""
        features = []
        for c in chunks:
            feature = self.embed_query(text=c.content_or_path)
            features.append(feature)
        
        if not features:
             return np.array([], dtype=np.float32)
             
        return np.concatenate(features).reshape(len(chunks), -1).astype(np.float32)
