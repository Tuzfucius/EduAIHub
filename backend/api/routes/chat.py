import json
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
import httpx

from config import settings
from api.deps import get_current_user
from models.all_models import User

router = APIRouter()

@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    内部封装安全的大模型代理网关：
    1. 必须携带合法的 JWT 才能访问，阻挡未授权白嫖。
    2. API Key 从后端的 settings 读取并注入，不暴露给前端。
    3. 支持 OpenAI 流式返回格式。
    """
    body = await request.json()
    
    # 获取自带密钥并提供双重兜底 (BYOK)
    custom_key = request.headers.get("x-provider-key")
    custom_base_url = request.headers.get("x-provider-baseurl")
    
    # 最终采用的 Provider 配置
    active_key = custom_key if custom_key else settings.OPENAI_API_KEY
    active_base_url = custom_base_url if custom_base_url else settings.OPENAI_BASE_URL
    
    if not active_key:
        # Dummy Response for testing if no key is set
        async def mock_stream():
            words = ["你好，", "我是", " EduAIHub", " 的", "专属 AI", "。由于未配置后端 API KEY 且您未提供自定义私钥，", "这是", "一段", "模拟的流式输出~"]
            for w in words:
                chunk = {"choices": [{"delta": {"content": w}}]}
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    headers = {
        "Authorization": f"Bearer {active_key}",
        "Content-Type": "application/json"
    }
    
    # Optional stream force
    body["stream"] = body.get("stream", True)
    
    async def proxy_stream():
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # 若 BaseURL 结尾没有 /chat/completions，这里应该如何拼装依据上游情况而定
                # 标准化处理 endpoint
                endpoint = f"{active_base_url.rstrip('/')}/chat/completions"
                if "/chat/completions" in active_base_url: 
                    endpoint = active_base_url # 防止重复拼接
                    
                async with client.stream(
                    "POST", 
                    endpoint,
                    json=body,
                    headers=headers
                ) as response:
                    async for chunk in response.aiter_bytes():
                        yield chunk
            except Exception as e:
                error_chunk = {"choices": [{"delta": {"content": f"\n\n[网络错误: {str(e)}]"}}]}
                yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
                yield "data: [DONE]\n\n"

    return StreamingResponse(proxy_stream(), media_type="text/event-stream")
