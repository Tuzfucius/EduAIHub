from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/proxy", tags=["Proxy"])

@router.post("/chat/completions")
async def proxy_chat_completions(request: Request):
    """
    OpenAI 兼容接口代理
    前端将原始 URL 和 Headers 放在请求体或自定义 Header 中传递
    """
    try:
        body = await request.json()
        target_url = body.get("target_url")
        api_key = body.get("api_key")
        payload = body.get("payload")

        if not target_url or not api_key:
            raise HTTPException(status_code=400, detail="Missing target_url or api_key")

        # 记录请求信息（不打印 API key）
        payload_size = len(json.dumps(payload)) if payload else 0
        logger.info(f"[Proxy] Target: {target_url}, Payload size: {payload_size} bytes")

        # 检查 payload 中是否有图片
        if payload and isinstance(payload, dict):
            messages = payload.get("messages", [])
            for msg in messages:
                if isinstance(msg.get("content"), list):
                    for content_item in msg["content"]:
                        if isinstance(content_item, dict) and content_item.get("type") == "image_url":
                            img_data = content_item.get("image_url", {}).get("url", "")
                            if img_data:
                                img_size = len(img_data)
                                logger.info(f"[Proxy] Image found in payload, base64 size: {img_size} bytes")

        # 构造请求头 (移除 host 等可能导致问题的头)
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        }

        async def upstream_generator():
            # 图片请求使用更长的超时 (120秒)
            timeout = 120.0 if payload_size > 500000 else 60.0
            logger.info(f"[Proxy] Using timeout: {timeout}s")

            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", target_url, json=payload, headers=headers) as response:
                    # 检查响应状态
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_msg = error_text.decode()
                        logger.error(f"[Proxy] Upstream error: {response.status_code} - {error_msg[:500]}")
                        yield f"error: {response.status_code} - {error_msg}\n\n"
                        return

                    # 记录响应开始
                    logger.info(f"[Proxy] Upstream response started, status: {response.status_code}")

                    async for chunk in response.aiter_bytes():
                        yield chunk

        return StreamingResponse(upstream_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Proxy Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
