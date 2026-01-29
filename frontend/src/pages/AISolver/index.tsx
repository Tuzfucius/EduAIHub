/**
 * AI Solver - AI 助手主页面
 * 完整的聊天界面，支持流式响应、会话管理、多模态输入和参数配置
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
import ModelConfigPanel from './components/ModelConfigPanel';
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
    const [showConfig, setShowConfig] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modelParams, setModelParams] = useState({ temperature: 0.7, top_p: 1.0 });
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const configPanelRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(0);

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
                // 切换会话后滚动到底部
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
                }, 0);
            }
        }
    }, [activeSessionId]);

    // 智能滚动：仅在添加新消息或正在流式生成时滚动
    useEffect(() => {
        const currentLength = messages.length;
        const prevLength = prevMessagesLengthRef.current;

        // 条件：新消息添加 或 有消息正在流式生成
        const hasNewMessage = currentLength > prevLength;
        const isStreaming = messages.some(m => m.isStreaming);

        if ((hasNewMessage || isStreaming) && shouldAutoScroll) {
            // 使用 requestAnimationFrame 确保 DOM 已更新
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            });
        }

        prevMessagesLengthRef.current = currentLength;
    }, [messages, shouldAutoScroll]);

    // 检测用户是否手动滚动（如果向上滚动，禁用自动滚动）
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // 点击外部关闭配置面板
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (configPanelRef.current && !configPanelRef.current.contains(event.target as Node)) {
                setShowConfig(false);
            }
        };
        if (showConfig) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showConfig]);

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

    // 核心发送逻辑
    const executeChat = async (currentMessages: chatService.Message[], userMsg: chatService.Message) => {
        if (!activeSessionId) return;

        // 创建 AI 消息占位
        const aiMessage = chatService.addMessage(activeSessionId, 'assistant', '', [], true);
        setMessages([...currentMessages, aiMessage]);

        setIsLoading(true);
        abortControllerRef.current = new AbortController();

        try {
            // 获取历史消息 (过滤掉正在生成的)
            const historyMessages = currentMessages
                .filter(m => !m.isStreaming)
                .map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                    images: m.images
                }));

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
                        chatService.updateMessage(activeSessionId, aiMessage.id, fullText, undefined, false);
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
                abortControllerRef.current,
                modelParams // 传入参数
            );
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    };

    // 发送消息
    const handleSend = useCallback(async (images?: string[]) => {
        const hasContent = inputValue.trim() || (images && images.length > 0);
        if (!hasContent || isLoading || !activeSessionId) return;

        if (!aiService.checkApiConfigured()) {
            setError('请先在设置中配置 API');
            return;
        }

        setError(null);
        const userContent = inputValue.trim();
        setInputValue('');

        // 添加用户消息
        const userMessage = chatService.addMessage(activeSessionId, 'user', userContent, images || []);
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);

        // 执行生成
        await executeChat(newMessages, userMessage);

    }, [inputValue, isLoading, activeSessionId, messages, modelParams]);

    // 删除消息
    const handleDeleteMessage = useCallback((id: string) => {
        if (!activeSessionId) return;
        chatService.deleteMessage(activeSessionId, id);
        setMessages(prev => prev.filter(m => m.id !== id));
        refreshSessions();
    }, [activeSessionId, refreshSessions]);

    // 编辑消息并重新发送
    const handleEditMessage = useCallback(async (id: string, newContent: string) => {
        if (!activeSessionId || isLoading) return;

        // 1. 找到要编辑的消息索引
        const index = messages.findIndex(m => m.id === id);
        if (index === -1) return;

        // 2. 截断消息：保留到该消息之前的所有消息
        const keptMessages = messages.slice(0, index);

        // 3. 删除后续所有消息（包括被编辑的这条，稍后重新添加）
        // 实际上我们应该更新数据库(localStorage)中的状态
        const messagesToDelete = messages.slice(index);
        messagesToDelete.forEach(m => chatService.deleteMessage(activeSessionId, m.id));

        // 4. 作为新消息重新添加并发送
        // 保持原有的图片附件
        const originalMsg = messages[index];
        const userMessage = chatService.addMessage(activeSessionId, 'user', newContent, originalMsg.images || []);

        const newMessages = [...keptMessages, userMessage];
        setMessages(newMessages);

        // 5. 触发生成
        await executeChat(newMessages, userMessage);

    }, [activeSessionId, isLoading, messages, modelParams]);

    // 重新生成
    const handleRegenerate = useCallback(async (id: string) => {
        if (!activeSessionId || isLoading) return;

        // 1. 找到 AI 回复的消息索引
        const index = messages.findIndex(m => m.id === id);
        if (index === -1) return;

        // 2. 找到对应的上一条用户消息
        // 如果是 assistant 消息，则保留到它之前的所有消息
        const keptMessages = messages.slice(0, index);

        // 3. 删除当前 AI 消息及之后的所有消息
        const messagesToDelete = messages.slice(index);
        messagesToDelete.forEach(m => chatService.deleteMessage(activeSessionId, m.id));

        // 4. 重设 UI 状态
        setMessages(keptMessages);

        // 5. 触发生成 (不需要 userMsg 参数，因为已经包含在 keptMessages 的最后一条了，但 executeChat 需要它作为上下文 anchor，这里我们稍微调整逻辑)
        // 我们的 executeChat 设计是接受 context 和 currentUserMsg。
        // 这里上下文就是 keptMessages，触发者是 keptMessages 的最后一条
        const lastUserMsg = keptMessages[keptMessages.length - 1];
        if (lastUserMsg && lastUserMsg.role === 'user') {
            await executeChat(keptMessages, lastUserMsg);
        }

    }, [activeSessionId, isLoading, messages, modelParams]);

    // 停止生成
    const handleStop = useCallback(() => {
        abortControllerRef.current?.abort();
        setIsLoading(false);
        setMessages(prev =>
            prev.map((m, i) =>
                i === prev.length - 1 && m.isStreaming
                    ? { ...m, isStreaming: false }
                    : m
            )
        );
    }, []);

    const promptInfo = getActivePromptInfo();
    const apiInfo = aiService.getCurrentApiInfo();

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--md-surface)]">
            {/* 顶部栏 */}
            <header
                className="h-14 px-4 flex items-center justify-between shrink-0 z-20 relative"
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
                        <h1 className="font-medium" style={{ color: 'var(--md-on-surface)' }}>
                            AI 助手
                        </h1>
                        <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                            {promptInfo.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {apiInfo && (
                        <div className="hidden sm:flex items-center gap-2">
                            <span
                                className="text-xs px-2 py-1 shape-full"
                                style={{
                                    backgroundColor: 'var(--md-secondary-container)',
                                    color: 'var(--md-on-secondary-container)',
                                }}
                            >
                                {apiInfo.model}
                            </span>
                        </div>
                    )}

                    {/* 参数设置按钮 */}
                    <div className="relative" ref={configPanelRef}>
                        <button
                            onClick={() => setShowConfig(!showConfig)}
                            className={`p-2 shape-full state-layer transition-colors ${showConfig ? 'bg-[var(--md-secondary-container)]' : ''}`}
                            style={{ color: showConfig ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)' }}
                            title="模型参数"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>

                        {/* 参数面板 Popover */}
                        {showConfig && (
                            <div className="absolute right-0 top-full mt-2 w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <ModelConfigPanel
                                    temperature={modelParams.temperature}
                                    topP={modelParams.top_p}
                                    onChange={setModelParams}
                                    className="shadow-xl"
                                />
                            </div>
                        )}
                    </div>

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

            <div className="flex-1 flex overflow-hidden relative">
                {/* 会话侧边栏 */}
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
                                <h2 className="font-medium" style={{ color: 'var(--md-on-surface)' }}>对话历史</h2>
                                <button onClick={() => setShowSidebar(false)} className="p-2 shape-full" style={{ color: 'var(--md-on-surface-variant)' }}>
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

                <aside
                    className="hidden lg:block w-64 p-4 shrink-0 overflow-y-auto"
                    style={{
                        backgroundColor: 'var(--md-surface-container-low)',
                        borderRight: '1px solid var(--md-outline-variant)',
                    }}
                >
                    <h2 className="font-medium mb-4" style={{ color: 'var(--md-on-surface)' }}>对话历史</h2>
                    <SessionList
                        sessions={sessions}
                        activeId={activeSessionId}
                        onSelect={handleSelectSession}
                        onDelete={handleDeleteSession}
                    />
                </aside>

                {/* 主聊天区域 */}
                <main className="flex-1 flex flex-col min-w-0 bg-[var(--md-surface)] relative">
                    {/* 错误提示 */}
                    {error && (
                        <div className="absolute top-4 left-4 right-4 z-30 p-3 shape-lg flex items-center gap-2 animate-in slide-in-from-top-2"
                            style={{ backgroundColor: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}>
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="text-sm flex-1">{error}</span>
                            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                        </div>
                    )}

                    {/* 消息列表 - 确保 flex-1 和 overflow-y-auto */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {messages.length === 0 ? (
                            <EmptyState onStart={() => setInputValue('请帮我解答一道数学题')} />
                        ) : (
                            messages.map(message => (
                                <ChatMessage
                                    key={message.id}
                                    message={message}
                                    onDelete={handleDeleteMessage}
                                    onEdit={handleEditMessage}
                                    onRegenerate={handleRegenerate}
                                />
                            ))
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* 输入框区域 - 固定在底部 */}
                    <div className="shrink-0 z-20">
                        <ChatInput
                            value={inputValue}
                            onChange={setInputValue}
                            onSend={handleSend}
                            onStop={handleStop}
                            isLoading={isLoading}
                            disabled={!aiService.checkApiConfigured()}
                            placeholder={aiService.checkApiConfigured() ? '输入问题，按 Enter 发送...' : '请先在设置中配置 API'}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

// ... unchanged sub-components (SessionList, EmptyState) ...
function SessionList({ sessions, activeId, onSelect, onDelete }: { sessions: chatService.ChatSession[]; activeId: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void; }) {
    return (
        <div className="space-y-1">
            {sessions.map(session => (
                <div
                    key={session.id}
                    className={`flex items-center gap-2 p-3 shape-lg cursor-pointer group transition-all`}
                    style={{ backgroundColor: session.id === activeId ? 'var(--md-secondary-container)' : 'transparent' }}
                    onClick={() => onSelect(session.id)}
                >
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: session.id === activeId ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface)' }}>{session.title}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--md-on-surface-variant)' }}>{session.messages.length} 条消息</p>
                    </div>
                    <button
                        className="p-1.5 shape-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--md-error)' }}
                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ onStart }: { onStart: () => void }) {
    const { getGradientStyle } = useTheme();
    const suggestions = ['请帮我解答一道数学题', '帮我复习物理公式', '写一份学习计划', '解释一下什么是导数'];

    return (
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 shape-xl flex items-center justify-center mb-6" style={getGradientStyle()}>
                <MessageSquarePlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--md-on-surface)' }}>开始新对话</h2>
            <p className="mb-6 max-w-md" style={{ color: 'var(--md-on-surface-variant)' }}>我是你的 AI 学习助手，可以帮你解答问题、批改作业、制定学习计划</p>
            <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((text, i) => (
                    <button key={i} onClick={() => onStart()} className="px-4 py-2 shape-full text-sm state-layer"
                        style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)' }}>
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
}
