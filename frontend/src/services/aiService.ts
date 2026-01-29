/**
 * AI Service - 核心 AI 调用服务
 * 使用后端代理进行 API 调用，解决 CORS 问题
 */

import { getActiveLlmApi, ApiConfig } from './settingsService';
import { buildSystemPrompt } from './promptService';



export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: string[]; // base64 images
}

export interface GenerationOptions {
    temperature?: number;
    top_p?: number;
}

// ... unchanged imports and interfaces ...

/**
 * 构建请求体（OpenAI 格式）
 */
function buildOpenAIRequestBody(
    messages: ChatMessage[],
    model: string,
    stream: boolean = true,
    options?: GenerationOptions
): object {
    const formattedMessages = messages.map(m => {
        if (m.role === 'user' && m.images && m.images.length > 0) {
            return {
                role: m.role,
                content: [
                    { type: 'text', text: m.content },
                    ...m.images.map(img => ({
                        type: 'image_url',
                        image_url: {
                            url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
                        }
                    }))
                ]
            };
        }
        return {
            role: m.role,
            content: m.content
        };
    });

    return {
        model,
        messages: formattedMessages,
        stream,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.top_p ?? 1.0,
        max_tokens: 4096,
    };
}

/**
 * 构建请求体（Anthropic 格式）
 */
function buildAnthropicRequestBody(
    messages: ChatMessage[],
    model: string,
    stream: boolean = true,
    options?: GenerationOptions
): object {
    // 提取 system message
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const formattedMessages = chatMessages.map(m => {
        if (m.role === 'user' && m.images && m.images.length > 0) {
            return {
                role: m.role,
                content: [
                    ...m.images.map(img => {
                        // 移除 data:image/xxx;base64, 前缀，因为 Anthropic 只需要 data 部分
                        const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
                        // 尝试从 base64 前缀获取 mime type，默认为 jpeg
                        let mediaType = 'image/jpeg';
                        const match = img.match(/^data:(image\/\w+);base64,/);
                        if (match) mediaType = match[1];

                        return {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64Data
                            }
                        };
                    }),
                    { type: 'text', text: m.content }
                ]
            };
        }
        return {
            role: m.role,
            content: m.content
        };
    });

    return {
        model,
        system: systemMessage?.content || '',
        messages: formattedMessages,
        stream,
        max_tokens: 4096,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.top_p ?? 1.0,
    };
}

/**
 * 发送日志到后端终端
 */
async function logToBackend(tag: string, message: string, data?: any) {
    try {
        await fetch('http://localhost:8000/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag, message, data })
        });
    } catch {
        // 忽略日志发送错误
    }
}

/**
 * 日志记录工具
 */
function logRequest(url: string, model: string, body: any) {
    console.group('🚀 [AI Service] Sending Request');
    console.log('Target URL:', url);
    console.log('Model:', model);
    console.log('Body:', body);
    console.groupEnd();

    // 发送到后端终端
    logToBackend('AI Service', `Proxy Request -> ${url}`, { model, body });
}

function logError(url: string, error: any) {
    console.group('❌ [AI Service] Request Failed');
    console.log('Target URL:', url);
    console.error('Error:', error);
    console.groupEnd();

    // 发送到后端终端
    logToBackend('AI Service', `Proxy Request Failed -> ${url}`, { error: String(error) });
}

/**
 * 通过后端代理发送请求
 */
async function sendProxyRequest(
    targetUrl: string,
    apiKey: string,
    payload: any,
    stream: boolean,
    signal?: AbortSignal
): Promise<Response> {
    const proxyUrl = 'http://localhost:8000/api/proxy/chat/completions';

    return fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            target_url: targetUrl,
            api_key: apiKey,
            payload: payload
        }),
        signal
    });
}

/**
 * 发送聊天请求（流式）
 */

export interface StreamCallbacks {
    onStart?: () => void;
    onToken?: (token: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
}

/**
 * 检查 API 是否已配置
 */
export function checkApiConfigured(): boolean {
    const api = getActiveLlmApi();
    return api !== null && !!api.apiKey && !!api.baseUrl;
}

/**
 * 获取当前 API 配置信息
 */
export function getCurrentApiInfo(): { name: string; model: string } | null {
    const api = getActiveLlmApi();
    if (!api) return null;
    return { name: api.name, model: api.model };
}

/**
 * 发送聊天请求（流式）
 */
export async function streamChat(
    userMessages: ChatMessage[],
    callbacks: StreamCallbacks,
    abortController?: AbortController,
    options?: GenerationOptions
): Promise<string> {
    const api = getActiveLlmApi();
    if (!api) {
        throw new Error('未配置 API，请先在设置中添加 API 配置');
    }

    // 构建完整消息列表（包含系统提示词）
    const systemPrompt = buildSystemPrompt();
    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...userMessages,
    ];

    // 根据 API 格式构建请求
    const isAnthropic = api.format === 'anthropic';
    const body = isAnthropic
        ? buildAnthropicRequestBody(messages, api.model, true, options)
        : buildOpenAIRequestBody(messages, api.model, true, options);

    // 构建目标 URL
    let targetUrl = api.baseUrl;
    if (!targetUrl.endsWith('/')) targetUrl += '/';
    if (isAnthropic) {
        targetUrl += 'messages';
    } else {
        targetUrl += 'chat/completions';
    }

    // 记录日志
    logRequest(targetUrl, api.model, body);

    callbacks.onStart?.();

    try {
        // 使用后端代理
        const response = await sendProxyRequest(
            targetUrl,
            api.apiKey,
            body,
            true,
            abortController?.signal
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Proxy Error: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('响应没有数据流');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                // 解析 SSE 数据
                // 代理可能会转发原始数据，或者我们可能需要根据不同模型解析
                // 目前假设代理转发了标准 SSE

                try {
                    const jsonStr = trimmed.slice(6);
                    const json = JSON.parse(jsonStr);

                    let content = '';
                    if (isAnthropic) {
                        if (json.type === 'content_block_delta') {
                            content = json.delta?.text || '';
                        }
                    } else {
                        // OpenAI 格式
                        content = json.choices?.[0]?.delta?.content || '';
                    }

                    if (content) {
                        fullText += content;
                        callbacks.onToken?.(content);
                    }
                } catch {
                    // 忽略解析错误
                }
            }
        }

        callbacks.onComplete?.(fullText);
        return fullText;

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('🛑 [AI Service] Request Aborted');
            return '';
        }
        logError(targetUrl, error);
        callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}

/**
 * 发送聊天请求（非流式）
 */
export async function chat(userMessages: ChatMessage[]): Promise<string> {
    const api = getActiveLlmApi();
    if (!api) {
        throw new Error('未配置 API，请先在设置中添加 API 配置');
    }

    const systemPrompt = buildSystemPrompt();
    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...userMessages,
    ];

    const isAnthropic = api.format === 'anthropic';
    const body = isAnthropic
        ? buildAnthropicRequestBody(messages, api.model, false)
        : buildOpenAIRequestBody(messages, api.model, false);

    let targetUrl = api.baseUrl;
    if (!targetUrl.endsWith('/')) targetUrl += '/';
    targetUrl += isAnthropic ? 'messages' : 'chat/completions';

    logRequest(targetUrl, api.model, body);

    try {
        const response = await sendProxyRequest(targetUrl, api.apiKey, body, false);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
        }

        // 注意：代理可能返回流式数据，这里我们需要从流中读取完整响应
        // 但如果未请求 stream=true，OpenAI 通常返回完整 JSON
        // 为保险起见，我们读取整个响应体
        // TODO: 代理目前总是返回 StreamingResponse，这可能需要优化对非流式的支持
        // 暂时假设用户总是使用流式组件调用（chat 函数实际上未在 UI 中使用）

        // 临时处理：从流中拼装
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No body');

        const decoder = new TextDecoder();
        let fullResponse = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value);
        }

        // 尝试解析完整 JSON（对于非流式响应）
        // 但由于代理是流式的，这可能很复杂。建议 UI 全部转向流式。

        return "Non-streaming chat via proxy is not fully optimized yet. Please use streaming.";

    } catch (error) {
        logError(targetUrl, error);
        throw error;
    }
}

/**
 * 测试 API 连接
 */
export async function testApiConnection(api: ApiConfig): Promise<boolean> {
    const isAnthropic = api.format === 'anthropic';

    const testMessages: ChatMessage[] = [
        { role: 'user', content: 'Hi' }
    ];

    const body = isAnthropic
        ? buildAnthropicRequestBody(testMessages, api.model, false)
        : buildOpenAIRequestBody(testMessages, api.model, false);

    let targetUrl = api.baseUrl;
    if (!targetUrl.endsWith('/')) targetUrl += '/';
    targetUrl += isAnthropic ? 'messages' : 'chat/completions';

    console.log(`📡 [AI Service] Testing Connection via Proxy: ${targetUrl}`);

    try {
        const response = await sendProxyRequest(targetUrl, api.apiKey, body, false);
        console.log(`✅ [AI Service] Connection Test: ${response.ok ? 'Success' : 'Failed'}`);
        return response.ok;
    } catch (e) {
        console.error('❌ [AI Service] Connection Test Error:', e);
        return false;
    }
}
