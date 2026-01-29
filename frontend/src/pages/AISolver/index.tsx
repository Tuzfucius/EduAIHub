/**
 * AI Solver - AI 助手主页面
 * 完整的聊天界面，支持流式响应和会话管理
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageSquarePlus,
    Trash2,
    Settings2,
    AlertCircle,
    Loader2,
    History,
    X,
    ChevronLeft
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import * as chatService from '@/services/chatService';
import * as aiService from '@/services/aiService';
import * as settingsService from '@/services/settingsService';
import { getActivePromptInfo } from '@/services/promptService';

export default function AISolver() {
    const { getGradientStyle } = useTheme();
    const { user } = useAuth();

    // 状态
    const [sessions, setSessions] = useState<chatService.ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<chatService.Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 初始化用户设置
    useEffect(() => {
        if (user?.id) {
            settingsService.setCurrentUser(user.id.toString());
        }
    }, [user]);

    // 加载会话列表
    useEffect(() => {
        const loadSessions = () => {
            const allSessions = chatService.getSessions();
            setSessions(allSessions);

            // 如果没有活动会话，创建一个或选择第一个
            if (!activeSessionId && allSessions.length > 0) {
                setActiveSessionId(allSessions[0].id);
                setMessages(allSessions[0].messages);
            } else if (!activeSessionId && allSessions.length === 0) {
                const newSession = chatService.createSession();
                setSessions([newSession]);
                setActiveSessionId(newSession.id);
                setMessages([]);
            }
        };
        loadSessions();
    }, [activeSessionId]);

    // 切换会话时加载消息
    useEffect(() => {
        if (activeSessionId) {
            const session = chatService.getSession(activeSessionId);
            if (session) {
                setMessages(session.messages);
            }
        }
    }, [activeSessionId]);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 刷新会话列表
    const refreshSessions = useCallback(() => {
        setSessions(chatService.getSessions());
    }, []);

    // 创建新会话
    const handleNewSession = useCallback(() => {
        const newSession = chatService.createSession();
        setActiveSessionId(newSession.id);
        setMessages([]);
        refreshSessions();
        setShowSidebar(false);
    }, [refreshSessions]);

    // 选择会话
    const handleSelectSession = useCallback((sessionId: string) => {
        setActiveSessionId(sessionId);
        const session = chatService.getSession(sessionId);
        if (session) {
            setMessages(session.messages);
        }
        setShowSidebar(false);
    }, []);

    // 删除会话
    const handleDeleteSession = useCallback((sessionId: string) => {
        chatService.deleteSession(sessionId);
        refreshSessions();

        if (sessionId === activeSessionId) {
            const remaining = chatService.getSessions();
            if (remaining.length > 0) {
                setActiveSessionId(remaining[0].id);
                setMessages(remaining[0].messages);
            } else {
                const newSession = chatService.createSession();
                setActiveSessionId(newSession.id);
                setMessages([]);
                refreshSessions();
            }
        }
    }, [activeSessionId, refreshSessions]);

    // 发送消息
    const handleSend = useCallback(async (images?: string[]) => {
        const hasContent = inputValue.trim() || (images && images.length > 0);
        if (!hasContent || isLoading || !activeSessionId) return;

        // 检查 API 配置
        if (!aiService.checkApiConfigured()) {
            setError('请先在设置中配置 API');
            return;
        }

        setError(null);
        const userContent = inputValue.trim();
        setInputValue('');

        // 添加用户消息
        const userMessage = chatService.addMessage(activeSessionId, 'user', userContent, images || []);
        setMessages(prev => [...prev, userMessage]);

        // 创建 AI 消息占位
        const aiMessage = chatService.addMessage(activeSessionId, 'assistant', '', true);
        setMessages(prev => [...prev, aiMessage]);

        setIsLoading(true);
        abortControllerRef.current = new AbortController();

        try {
            // 获取历史消息
            const historyMessages = chatService.getMessagesForAI(activeSessionId);

            // 流式调用
            await aiService.streamChat(
                historyMessages,
                {
                    onToken: (token) => {
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === aiMessage.id
                                    ? { ...m, content: m.content + token, isStreaming: true }
                                    : m
                            )
                        );
                    },
                    onComplete: (fullText) => {
                        chatService.updateMessage(activeSessionId, aiMessage.id, fullText, false);
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === aiMessage.id
                                    ? { ...m, content: fullText, isStreaming: false }
                                    : m
                            )
                        );
                        refreshSessions();
                    },
                    onError: (err) => {
                        setError(err.message);
                        // 删除失败的 AI 消息
                        chatService.deleteMessage(activeSessionId, aiMessage.id);
                        setMessages(prev => prev.filter(m => m.id !== aiMessage.id));
                    },
                },
                abortControllerRef.current
            );
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [inputValue, isLoading, activeSessionId, refreshSessions]);

    // 停止生成
    const handleStop = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsLoading(false);

        // 更新最后一条消息状态
        setMessages(prev =>
            prev.map((m, i) =>
                i === prev.length - 1 && m.isStreaming
                    ? { ...m, isStreaming: false }
                    : m
            )
        );
    }, []);

    // 获取当前提示词信息
    const promptInfo = getActivePromptInfo();
    const apiInfo = aiService.getCurrentApiInfo();

    return (
        <div className="h-full flex flex-col">
            {/* 顶部栏 */}
            <header
                className="h-14 px-4 flex items-center justify-between shrink-0"
                style={{
                    backgroundColor: 'var(--md-surface-container)',
                    borderBottom: '1px solid var(--md-outline-variant)',
                }}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="lg:hidden p-2 shape-full state-layer"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                        <History className="w-5 h-5" />
                    </button>
                    <div>
                        <h1
                            className="font-medium"
                            style={{ color: 'var(--md-on-surface)' }}
                        >
                            AI 助手
                        </h1>
                        <p
                            className="text-xs"
                            style={{ color: 'var(--md-on-surface-variant)' }}
                        >
                            {promptInfo.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {apiInfo && (
                        <span
                            className="text-xs px-2 py-1 shape-full"
                            style={{
                                backgroundColor: 'var(--md-secondary-container)',
                                color: 'var(--md-on-secondary-container)',
                            }}
                        >
                            {apiInfo.model}
                        </span>
                    )}
                    <button
                        onClick={handleNewSession}
                        className="p-2 shape-full state-layer"
                        style={{ color: 'var(--md-primary)' }}
                        title="新对话"
                    >
                        <MessageSquarePlus className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* 会话侧边栏 (移动端) */}
                {showSidebar && (
                    <div
                        className="fixed inset-0 z-40 lg:hidden"
                        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                        onClick={() => setShowSidebar(false)}
                    >
                        <div
                            className="absolute left-0 top-0 h-full w-72 p-4"
                            style={{ backgroundColor: 'var(--md-surface-container)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2
                                    className="font-medium"
                                    style={{ color: 'var(--md-on-surface)' }}
                                >
                                    对话历史
                                </h2>
                                <button
                                    onClick={() => setShowSidebar(false)}
                                    className="p-2 shape-full"
                                    style={{ color: 'var(--md-on-surface-variant)' }}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <SessionList
                                sessions={sessions}
                                activeId={activeSessionId}
                                onSelect={handleSelectSession}
                                onDelete={handleDeleteSession}
                            />
                        </div>
                    </div>
                )}

                {/* 会话侧边栏 (桌面端) */}
                <aside
                    className="hidden lg:block w-64 p-4 shrink-0 overflow-y-auto"
                    style={{
                        backgroundColor: 'var(--md-surface-container-low)',
                        borderRight: '1px solid var(--md-outline-variant)',
                    }}
                >
                    <h2
                        className="font-medium mb-4"
                        style={{ color: 'var(--md-on-surface)' }}
                    >
                        对话历史
                    </h2>
                    <SessionList
                        sessions={sessions}
                        activeId={activeSessionId}
                        onSelect={handleSelectSession}
                        onDelete={handleDeleteSession}
                    />
                </aside>

                {/* 主聊天区域 */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* 错误提示 */}
                    {error && (
                        <div
                            className="mx-4 mt-4 p-3 shape-lg flex items-center gap-2"
                            style={{
                                backgroundColor: 'var(--md-error-container)',
                                color: 'var(--md-on-error-container)',
                            }}
                        >
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="text-sm flex-1">{error}</span>
                            <button onClick={() => setError(null)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* 消息列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <EmptyState onStart={() => setInputValue('请帮我解答一道数学题')} />
                        ) : (
                            messages.map(message => (
                                <ChatMessage key={message.id} message={message} />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* 输入框 */}
                    <ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={handleSend}
                        onStop={handleStop}
                        isLoading={isLoading}
                        disabled={!aiService.checkApiConfigured()}
                        placeholder={
                            aiService.checkApiConfigured()
                                ? '输入问题，按 Enter 发送...'
                                : '请先在设置中配置 API'
                        }
                    />
                </main>
            </div>
        </div>
    );
}

// 会话列表组件
function SessionList({
    sessions,
    activeId,
    onSelect,
    onDelete
}: {
    sessions: chatService.ChatSession[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="space-y-1">
            {sessions.map(session => (
                <div
                    key={session.id}
                    className={`flex items-center gap-2 p-3 shape-lg cursor-pointer group transition-all`}
                    style={{
                        backgroundColor: session.id === activeId
                            ? 'var(--md-secondary-container)'
                            : 'transparent',
                    }}
                    onClick={() => onSelect(session.id)}
                >
                    <div className="flex-1 min-w-0">
                        <p
                            className="text-sm font-medium truncate"
                            style={{
                                color: session.id === activeId
                                    ? 'var(--md-on-secondary-container)'
                                    : 'var(--md-on-surface)',
                            }}
                        >
                            {session.title}
                        </p>
                        <p
                            className="text-xs truncate"
                            style={{ color: 'var(--md-on-surface-variant)' }}
                        >
                            {session.messages.length} 条消息
                        </p>
                    </div>
                    <button
                        className="p-1.5 shape-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--md-error)' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(session.id);
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// 空状态组件
function EmptyState({ onStart }: { onStart: () => void }) {
    const { getGradientStyle } = useTheme();
    const suggestions = [
        '请帮我解答一道数学题',
        '帮我复习物理公式',
        '写一份学习计划',
        '解释一下什么是导数',
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div
                className="w-20 h-20 shape-xl flex items-center justify-center mb-6"
                style={getGradientStyle()}
            >
                <MessageSquarePlus className="w-10 h-10 text-white" />
            </div>
            <h2
                className="text-xl font-medium mb-2"
                style={{ color: 'var(--md-on-surface)' }}
            >
                开始新对话
            </h2>
            <p
                className="mb-6 max-w-md"
                style={{ color: 'var(--md-on-surface-variant)' }}
            >
                我是你的 AI 学习助手，可以帮你解答问题、批改作业、制定学习计划
            </p>
            <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((text, i) => (
                    <button
                        key={i}
                        onClick={() => onStart()}
                        className="px-4 py-2 shape-full text-sm state-layer"
                        style={{
                            backgroundColor: 'var(--md-surface-container-highest)',
                            color: 'var(--md-on-surface)',
                        }}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
}
