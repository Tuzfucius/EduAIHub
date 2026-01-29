/**
 * AI Service - 核心 AI 调用服务
 * 直接调用 OpenAI 兼容 API，支持流式响应
 */

import { getActiveLlmApi, ApiConfig } from './settingsService';
import { buildSystemPrompt } from './promptService';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

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
 * 构建请求体（OpenAI 格式）
 */
function buildOpenAIRequestBody(
    messages: ChatMessage[],
    model: string,
    stream: boolean = true
): object {
    return {
        model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: 4096,
    };
}

/**
 * 构建请求体（Anthropic 格式）
 */
function buildAnthropicRequestBody(
    messages: ChatMessage[],
    model: string,
    stream: boolean = true
): object {
    // 提取 system message
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    return {
        model,
        system: systemMessage?.content || '',
        messages: chatMessages.map(m => ({
            role: m.role,
            content: m.content,
        })),
        stream,
        max_tokens: 4096,
    };
}

/**
 * 解析 OpenAI 流式响应
 */
async function* parseOpenAIStream(
    reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string> {
    const decoder = new TextDecoder();
    let buffer = '';

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

            try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            } catch {
                // 忽略解析错误
            }
        }
    }
}

/**
 * 解析 Anthropic 流式响应
 */
async function* parseAnthropicStream(
    reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string> {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            try {
                const json = JSON.parse(trimmed.slice(6));
                if (json.type === 'content_block_delta') {
                    const text = json.delta?.text;
                    if (text) {
                        yield text;
                    }
                }
            } catch {
                // 忽略解析错误
            }
        }
    }
}

/**
 * 发送聊天请求（流式）
 */
export async function streamChat(
    userMessages: ChatMessage[],
    callbacks: StreamCallbacks,
    abortController?: AbortController
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
        ? buildAnthropicRequestBody(messages, api.model, true)
        : buildOpenAIRequestBody(messages, api.model, true);

    // 构建请求头
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (isAnthropic) {
        headers['x-api-key'] = api.apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else {
        headers['Authorization'] = `Bearer ${api.apiKey}`;
    }

    // 构建 URL
    let url = api.baseUrl;
    if (!url.endsWith('/')) url += '/';
    if (isAnthropic) {
        url += 'messages';
    } else {
        url += 'chat/completions';
    }

    callbacks.onStart?.();

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: abortController?.signal,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
        }

        if (!response.body) {
            throw new Error('响应没有数据流');
        }

        const reader = response.body.getReader();
        const parser = isAnthropic
            ? parseAnthropicStream(reader)
            : parseOpenAIStream(reader);

        let fullText = '';

        for await (const token of parser) {
            fullText += token;
            callbacks.onToken?.(token);
        }

        callbacks.onComplete?.(fullText);
        return fullText;

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            // 用户主动取消，不抛出错误
            return '';
        }
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

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (isAnthropic) {
        headers['x-api-key'] = api.apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else {
        headers['Authorization'] = `Bearer ${api.apiKey}`;
    }

    let url = api.baseUrl;
    if (!url.endsWith('/')) url += '/';
    url += isAnthropic ? 'messages' : 'chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (isAnthropic) {
        return data.content?.[0]?.text || '';
    } else {
        return data.choices?.[0]?.message?.content || '';
    }
}

/**
 * 测试 API 连接
 */
export async function testApiConnection(api: ApiConfig): Promise<boolean> {
    const isAnthropic = api.format === 'anthropic';

    const testMessages: ChatMessage[] = [
        { role: 'user', content: '请回复"连接成功"这四个字' }
    ];

    const body = isAnthropic
        ? buildAnthropicRequestBody(testMessages, api.model, false)
        : buildOpenAIRequestBody(testMessages, api.model, false);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (isAnthropic) {
        headers['x-api-key'] = api.apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else {
        headers['Authorization'] = `Bearer ${api.apiKey}`;
    }

    let url = api.baseUrl;
    if (!url.endsWith('/')) url += '/';
    url += isAnthropic ? 'messages' : 'chat/completions';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        return response.ok;
    } catch {
        return false;
    }
}
