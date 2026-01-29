/**
 * Chat Service - 聊天会话管理
 * 管理会话历史、消息存储和 LocalStorage 持久化
 */

import { getCurrentUserId } from './settingsService';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    isStreaming?: boolean;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
    updatedAt: string;
}

// 存储 key
function getSessionsKey(): string {
    const userId = getCurrentUserId();
    return userId
        ? `eduaihub_chat_sessions_${userId}`
        : 'eduaihub_chat_sessions_guest';
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取所有会话
 */
export function getSessions(): ChatSession[] {
    try {
        const stored = localStorage.getItem(getSessionsKey());
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch {
        return [];
    }
}

/**
 * 保存所有会话
 */
function saveSessions(sessions: ChatSession[]): void {
    localStorage.setItem(getSessionsKey(), JSON.stringify(sessions));
}

/**
 * 获取单个会话
 */
export function getSession(id: string): ChatSession | null {
    const sessions = getSessions();
    return sessions.find(s => s.id === id) || null;
}

/**
 * 创建新会话
 */
export function createSession(title?: string): ChatSession {
    const sessions = getSessions();
    const now = new Date().toISOString();

    const newSession: ChatSession = {
        id: generateId(),
        title: title || `新对话 ${sessions.length + 1}`,
        messages: [],
        createdAt: now,
        updatedAt: now,
    };

    sessions.unshift(newSession); // 新会话放在最前面
    saveSessions(sessions);
    return newSession;
}

/**
 * 更新会话标题
 */
export function updateSessionTitle(id: string, title: string): ChatSession | null {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === id);
    if (index === -1) return null;

    sessions[index].title = title;
    sessions[index].updatedAt = new Date().toISOString();
    saveSessions(sessions);
    return sessions[index];
}

/**
 * 删除会话
 */
export function deleteSession(id: string): boolean {
    const sessions = getSessions();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === sessions.length) return false;

    saveSessions(filtered);
    return true;
}

/**
 * 添加消息到会话
 */
export function addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    isStreaming: boolean = false
): Message {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);

    if (index === -1) {
        throw new Error('会话不存在');
    }

    const message: Message = {
        id: generateId(),
        role,
        content,
        timestamp: new Date().toISOString(),
        isStreaming,
    };

    sessions[index].messages.push(message);
    sessions[index].updatedAt = new Date().toISOString();

    // 如果是第一条用户消息，用它来更新标题
    if (role === 'user' && sessions[index].messages.length === 1) {
        sessions[index].title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }

    saveSessions(sessions);
    return message;
}

/**
 * 更新消息内容
 */
export function updateMessage(
    sessionId: string,
    messageId: string,
    content: string,
    isStreaming?: boolean
): Message | null {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return null;

    const messageIndex = sessions[sessionIndex].messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return null;

    sessions[sessionIndex].messages[messageIndex].content = content;
    if (isStreaming !== undefined) {
        sessions[sessionIndex].messages[messageIndex].isStreaming = isStreaming;
    }
    sessions[sessionIndex].updatedAt = new Date().toISOString();

    saveSessions(sessions);
    return sessions[sessionIndex].messages[messageIndex];
}

/**
 * 删除消息
 */
export function deleteMessage(sessionId: string, messageId: string): boolean {
    const sessions = getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return false;

    const originalLength = sessions[sessionIndex].messages.length;
    sessions[sessionIndex].messages = sessions[sessionIndex].messages.filter(
        m => m.id !== messageId
    );

    if (sessions[sessionIndex].messages.length === originalLength) return false;

    sessions[sessionIndex].updatedAt = new Date().toISOString();
    saveSessions(sessions);
    return true;
}

/**
 * 清空会话消息
 */
export function clearSessionMessages(sessionId: string): boolean {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index === -1) return false;

    sessions[index].messages = [];
    sessions[index].updatedAt = new Date().toISOString();
    saveSessions(sessions);
    return true;
}

/**
 * 获取会话消息（用于 AI 调用）
 */
export function getMessagesForAI(sessionId: string): { role: 'user' | 'assistant'; content: string }[] {
    const session = getSession(sessionId);
    if (!session) return [];

    return session.messages
        .filter(m => !m.isStreaming) // 排除正在流式输出的消息
        .map(m => ({
            role: m.role,
            content: m.content,
        }));
}

/**
 * 获取最近的会话 ID
 */
export function getRecentSessionId(): string | null {
    const sessions = getSessions();
    return sessions[0]?.id || null;
}

/**
 * 确保有一个活动会话
 */
export function ensureActiveSession(): ChatSession {
    const sessions = getSessions();
    if (sessions.length === 0) {
        return createSession();
    }
    return sessions[0];
}
