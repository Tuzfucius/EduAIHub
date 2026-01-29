from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx

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

        # 构造请求头 (移除 host 等可能导致问题的头)
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        }

        async def upstream_generator():
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", target_url, json=payload, headers=headers) as response:
                    # 检查响应状态
                    if response.status_code != 200:
                        error_text = await response.aread()
                        yield f"error: {response.status_code} - {error_text.decode()}\n\n"
                        return

                    async for chunk in response.aiter_bytes():
                        yield chunk

        return StreamingResponse(upstream_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"Proxy Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
