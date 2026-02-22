import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, Paperclip, Settings2, Hash, Plus, MessageSquare, Trash2, Cpu, SlidersHorizontal, Eye, FileText, Image as ImageIcon, X, ChevronDown, ChevronRight, BrainCircuit, PanelLeftClose, PanelRightClose, PanelLeft, PanelRight, Link, Expand, Shrink, FileCode, Check, Copy, Pencil, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

function parseMessageContent(text: string) {
    const blocks: { type: 'think' | 'text', content: string }[] = [];
    let currentHtml = text;

    while (currentHtml.length > 0) {
        const thinkStart = currentHtml.indexOf('<think>');
        if (thinkStart === -1) {
            blocks.push({ type: 'text', content: currentHtml });
            break;
        }

        if (thinkStart > 0) {
            blocks.push({ type: 'text', content: currentHtml.substring(0, thinkStart) });
        }

        const thinkEnd = currentHtml.indexOf('</think>', thinkStart);
        if (thinkEnd === -1) {
            blocks.push({ type: 'think', content: currentHtml.substring(thinkStart + 7) });
            break;
        } else {
            blocks.push({ type: 'think', content: currentHtml.substring(thinkStart + 7, thinkEnd) });
            currentHtml = currentHtml.substring(thinkEnd + 8);
        }
    }

    return blocks;
}

const EnhancedMarkdown = ({ content }: { content: string }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[15px]">{children}</p>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/30 hover:decoration-indigo-300 transition-all font-medium">{children}</a>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 marker:text-indigo-400/50">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 marker:text-indigo-400/80 font-medium">{children}</ol>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-slate-800 dark:text-slate-100">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 text-slate-800 dark:text-slate-200">{children}</h3>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 pl-4 py-2 my-4 rounded-r-xl italic text-slate-600 dark:text-slate-400">{children}</blockquote>,
                table: ({ children }) => <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"><table className="w-full text-left border-collapse text-sm">{children}</table></div>,
                thead: ({ children }) => <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 bg-white dark:bg-slate-900/50">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">{children}</tr>,
                th: ({ children }) => <th className="px-4 py-3 font-bold">{children}</th>,
                td: ({ children }) => <td className="px-4 py-3">{children}</td>,
                code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');

                    if (isInline) {
                        return (
                            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono text-pink-600 dark:text-pink-400 font-bold border border-slate-200 dark:border-slate-700/50" {...rest}>
                                {children}
                            </code>
                        );
                    }

                    const codeString = String(children).replace(/\n$/, '');

                    return (
                        <div className="my-4 rounded-xl overflow-hidden bg-[#1e1e1e] border border-slate-800 shadow-xl group/code relative">
                            <div className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-bold flex justify-between items-center border-b border-white/5">
                                <span className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5" />{match ? match[1].toUpperCase() : 'TEXT'}</span>
                                <button
                                    onClick={() => navigator.clipboard.writeText(codeString)}
                                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 opacity-50 hover:opacity-100"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                </button>
                            </div>
                            <div className="overflow-x-auto no-scrollbar max-w-full text-[13.5px]">
                                <SyntaxHighlighter
                                    {...rest}
                                    PreTag="div"
                                    children={codeString}
                                    language={match ? match[1] : 'text'}
                                    style={vscDarkPlus}
                                    customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                                    wrapLines={true}
                                />
                            </div>
                        </div>
                    );
                }
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

const ThinkBlock = ({ content, isStreaming }: { content: string, isStreaming: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isStreaming) {
            setIsOpen(true);
        }
    }, [isStreaming]);

    return (
        <div className="my-3 border border-indigo-100 dark:border-indigo-500/30 rounded-xl overflow-hidden bg-white/50 dark:bg-indigo-900/10 transition-all shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-indigo-500/80 hover:bg-white dark:hover:bg-indigo-900/30 transition-colors"
                title="深度思考过程"
            >
                <div className="flex items-center gap-2">
                    {isStreaming ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    ) : (
                        <BrainCircuit className="w-4 h-4" />
                    )}
                    {isStreaming ? '正在进行深度推理计算...' : '已完成推理链路 (点击查看)'}
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 text-[13.5px] text-slate-500 dark:text-slate-400 border-t border-indigo-100 dark:border-indigo-500/20 whitespace-pre-wrap font-mono italic bg-slate-50/50 dark:bg-slate-900/40 leading-relaxed border-l-2 border-l-indigo-400">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
import { useAuth } from '@/contexts/AuthContext';
import { generateSystemMessage, PromptSettings, buildSystemPrompt } from '@/services/promptService';
import * as settingsService from '@/services/settingsService';

interface Attachment {
    id: string;
    file?: File;
    name: string;
    type: 'image' | 'text';
    dataUrl?: string;
    content?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: { name: string; type: string; dataUrl?: string; content?: string }[];
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
}

interface ModelParams {
    temperature: number;
    top_p: number;
    max_tokens: number;
}

export default function AISolverPage() {
    const { user } = useAuth();

    // --- State: Sessions ---
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string>('');
    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    // --- State: Current Chat ---
    const [input, setInput] = useState('');
    const [isReceiving, setReceiving] = useState(false);

    // --- State: Attachments ---
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- State: Settings & Params ---
    const [globalSettings, setGlobalSettings] = useState(settingsService.getSettings());
    const [activeLlm, setActiveLlm] = useState(settingsService.getActiveLlmApi());

    // Sidebar folding states
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

    const [modelParams, setModelParams] = useState<ModelParams>({
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
    });

    // --- Context Menu & Session Editing ---
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, sessionId: string } | null>(null);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editSessionTitle, setEditSessionTitle] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load: Sessions from LocalStorage
    useEffect(() => {
        const stored = localStorage.getItem('eduaihub_chat_sessions');
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as ChatSession[];
                if (parsed.length > 0) {
                    // Fix duplicate IDs from previous bugs
                    const idSet = new Set<string>();
                    const deduplicated = parsed.map(s => {
                        let uniqueId = s.id;
                        while (idSet.has(uniqueId)) {
                            uniqueId = `${uniqueId}_${Math.random().toString(36).substring(7)}`;
                        }
                        idSet.add(uniqueId);
                        return { ...s, id: uniqueId };
                    });

                    setSessions(deduplicated);
                    setActiveSessionId(deduplicated[0].id);
                } else {
                    createNewSession();
                }
            } catch (e) {
                createNewSession();
            }
        } else {
            createNewSession();
        }

        // Setup storage listener for cross-tab sync of settings
        const handleStorageChange = () => {
            const userTemp = settingsService.getCurrentUserId() || 'guest';
            settingsService.setCurrentUser(userTemp);
            setGlobalSettings(settingsService.getSettings());
            setActiveLlm(settingsService.getActiveLlmApi());
        };
        handleStorageChange(); // First init
        window.addEventListener('storage', handleStorageChange);

        // Also listen to focus event to do a pseudo-reload when navigating back from settings
        window.addEventListener('focus', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleStorageChange);
        };
    }, []);

    // Save Sessions
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('eduaihub_chat_sessions', JSON.stringify(sessions));
        }
    }, [sessions]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [activeSession?.messages, isReceiving]);

    // Global click listener to close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: '全新推演节点',
            messages: [{ id: '1', role: 'assistant', content: '# 👋 欢迎建立新连接\n\n您现在的所思所想是什么？让我们开始推理。' }],
            updatedAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
    };

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSessions(prev => {
            const next = prev.filter(s => s.id !== id);
            if (next.length === 0) {
                // If deleting last one, create new empty one
                const newOne = {
                    id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    title: '新连接',
                    messages: [{ id: '1', role: 'assistant', content: '新会话已建立。' }],
                    updatedAt: Date.now()
                };
                setActiveSessionId(newOne.id);
                return [newOne];
            }
            if (activeSessionId === id) {
                setActiveSessionId(next[0].id);
            }
            return next;
        });
    };

    const updateActiveSession = (newMessages: Message[], newTitle?: string) => {
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    messages: newMessages,
                    title: newTitle || s.title,
                    updatedAt: Date.now()
                };
            }
            return s;
        }));
    };

    const handleContextMenu = (e: React.MouseEvent, sessionId: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            sessionId
        });
    };

    const duplicateSession = (sessionId: string) => {
        const target = sessions.find(s => s.id === sessionId);
        if (!target) return;
        const cloned: ChatSession = {
            ...target,
            id: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            title: `${target.title} (副本)`,
            updatedAt: Date.now()
        };
        setSessions(prev => [cloned, ...prev]);
        setActiveSessionId(cloned.id);
        setContextMenu(null);
    };

    const triggerEditSession = (sessionId: string) => {
        const target = sessions.find(s => s.id === sessionId);
        if (!target) return;
        setEditSessionTitle(target.title);
        setEditingSessionId(sessionId);
        setContextMenu(null);
    };

    const saveSessionTitle = () => {
        if (!editingSessionId) return;
        if (editSessionTitle.trim()) {
            setSessions(prev => prev.map(s =>
                s.id === editingSessionId ? { ...s, title: editSessionTitle.trim() } : s
            ));
        }
        setEditingSessionId(null);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
        const newAttachments: Attachment[] = [];

        for (const file of files) {
            const isImage = file.type.startsWith('image/');
            const attachment: Attachment = {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                file,
                name: file.name,
                type: isImage ? 'image' : 'text'
            };

            try {
                if (isImage) {
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                    attachment.dataUrl = dataUrl;
                } else {
                    const content = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsText(file);
                    });
                    attachment.content = content;
                }
                newAttachments.push(attachment);
            } catch (error) {
                console.error("Failed to read file", file.name, error);
            }
        }

        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSend = async () => {
        if ((!input.trim() && attachments.length === 0) || isReceiving || !activeSession) return;

        const userMsgContent = input;
        setInput('');
        const currentAttachments = [...attachments];
        setAttachments([]);

        // If it's the first user message, rename the session title based on input
        let newTitle = activeSession.title;
        if (activeSession.messages.length <= 1) {
            newTitle = userMsgContent.slice(0, 15) + (userMsgContent.length > 15 ? '...' : '');
        }

        const newMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMsgContent,
            attachments: currentAttachments.map(a => ({
                name: a.name,
                type: a.type,
                dataUrl: a.dataUrl,
                content: a.content
            }))
        };
        const updatedMessages = [...activeSession.messages, newMsg];
        updateActiveSession(updatedMessages, newTitle);
        setReceiving(true);

        const botMsgId = (Date.now() + 1).toString();

        // Pre-add empty bot message
        updateActiveSession([...updatedMessages, { id: botMsgId, role: 'assistant', content: '' }], newTitle);

        try {
            // Generate system prompt
            const systemMsg = await generateSystemMessage(globalSettings as PromptSettings, user?.username);
            const chatHistory = [systemMsg].concat(
                updatedMessages.map(m => {
                    let contentPayload: any = m.content || "";
                    if (m.attachments && m.attachments.length > 0) {
                        let textMerged = m.content || "";
                        const images: any[] = [];
                        for (const att of m.attachments) {
                            if (att.type === 'text' && att.content) {
                                textMerged += `\n\n--- 附件文档 [${att.name}] ---\n${att.content}`;
                            } else if (att.type === 'image' && att.dataUrl) {
                                images.push({ type: "image_url", image_url: { url: att.dataUrl } });
                            }
                        }
                        if (images.length > 0) {
                            contentPayload = [{ type: "text", text: textMerged }, ...images];
                            // If user only sent image and no text, model needs some text in the array
                            if (!textMerged.trim()) {
                                contentPayload.unshift({ type: "text", text: "请分析这张图片。" });
                            }
                        } else {
                            contentPayload = textMerged;
                        }
                    }
                    return { role: m.role, content: contentPayload };
                })
            );

            const token = localStorage.getItem('eduaihub_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // Inject Custom LLM Provider logic if active
            if (activeLlm) {
                if (activeLlm.apiKey) headers['x-provider-key'] = activeLlm.apiKey;
                if (activeLlm.baseUrl) headers['x-provider-baseurl'] = activeLlm.baseUrl;
            }

            const res = await fetch('/api/v1/ai/chat/completions', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: activeLlm?.model || "gpt-4o-mini",
                    messages: chatHistory,
                    temperature: modelParams.temperature,
                    top_p: modelParams.top_p,
                    max_tokens: modelParams.max_tokens,
                    stream: true
                })
            });

            if (!res.ok) throw new Error('API Error');
            const reader = res.body?.getReader();
            const decoder = new TextDecoder("utf-8");
            let currentResponse = '';

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkStr = decoder.decode(value, { stream: true });
                const lines = chunkStr.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.choices[0].delta.content) {
                                currentResponse += data.choices[0].delta.content;
                                // Need functional state update to always get latest messages in the loop
                                setSessions(prevSessions => prevSessions.map(s => {
                                    if (s.id === activeSessionId) {
                                        return {
                                            ...s,
                                            messages: s.messages.map(m => m.id === botMsgId ? { ...m, content: currentResponse } : m)
                                        };
                                    }
                                    return s;
                                }));
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (e) {
            setSessions(prevSessions => prevSessions.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        messages: s.messages.map(m => m.id === botMsgId ? { ...m, content: '📡 [星际通讯中断] 后端大模型线路异常或超时。请检查「统一设置」下的自定义网关密钥。' } : m)
                    };
                }
                return s;
            }));
        } finally {
            setReceiving(false);
        }
    };

    // Derived System Prompt Preview
    const currentSystemPrompt = buildSystemPrompt(globalSettings);

    return (
        <div className="h-screen w-full flex pt-4 pr-4 pl-4 sm:pl-0 pb-4 md:pb-20 lg:pb-4 relative gap-4">
            {/* Background Orbs */}
            <div className="absolute top-[20%] right-[30%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none -z-10" />

            {/* Left Sidebar: Session History */}
            <AnimatePresence initial={false}>
                {leftSidebarOpen && (
                    <motion.div
                        key="left-sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 288, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="hidden lg:flex flex-col glass-panel rounded-[2rem] border-white/40 dark:border-white/10 shadow-2xl overflow-hidden shrink-0 h-full bg-white/50 dark:bg-slate-900/40"
                    >
                        <div className="w-72 h-full flex flex-col shrink-0">
                            <div className="p-5 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
                                <button
                                    onClick={createNewSession}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-transform active:scale-95"
                                >
                                    <Plus className="w-5 h-5" /> 发起新连接
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                                {sessions.map(session => (
                                    <div
                                        key={session.id}
                                        onClick={() => !isReceiving && setActiveSessionId(session.id)}
                                        onContextMenu={(e) => handleContextMenu(e, session.id)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all group flex items-center justify-between relative ${activeSessionId === session.id ? 'bg-white dark:bg-slate-800 shadow-sm border border-indigo-100 dark:border-slate-600' : 'hover:bg-white/60 dark:hover:bg-slate-800/60 border border-transparent'} ${isReceiving ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                            <MessageSquare className={`w-4 h-4 shrink-0 ${activeSessionId === session.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                                            {editingSessionId === session.id ? (
                                                <input
                                                    autoFocus
                                                    value={editSessionTitle}
                                                    onChange={e => setEditSessionTitle(e.target.value)}
                                                    onBlur={saveSessionTitle}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') saveSessionTitle();
                                                        if (e.key === 'Escape') setEditingSessionId(null);
                                                    }}
                                                    className="w-full bg-slate-100 dark:bg-slate-900 border-none outline-none text-sm font-semibold rounded px-2 py-0.5 text-slate-800 dark:text-white"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className={`truncate text-sm font-semibold ${activeSessionId === session.id ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {session.title}
                                                </span>
                                            )}
                                        </div>
                                        {/* Inline Delete (Visible on hover as fallback to Right Click) */}
                                        {!editingSessionId && (
                                            <button
                                                onClick={(e) => {
                                                    deleteSession(e, session.id);
                                                    setContextMenu(null);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all shrink-0 ml-2"
                                                title="删除会话"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating Context Menu */}
                        <AnimatePresence>
                            {contextMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-1.5 min-w-[160px] overflow-hidden backdrop-blur-xl"
                                    style={{
                                        top: Math.min(contextMenu.y, window.innerHeight - 150),
                                        left: Math.min(contextMenu.x, window.innerWidth - 200)
                                    }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => triggerEditSession(contextMenu.sessionId)}
                                        className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <Pencil className="w-4 h-4 text-indigo-500" /> 重命名会话
                                    </button>
                                    <button
                                        onClick={() => duplicateSession(contextMenu.sessionId)}
                                        className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <Copy className="w-4 h-4 text-emerald-500" /> 派生副本
                                    </button>
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1 mx-2" />
                                    <button
                                        onClick={(e) => {
                                            deleteSession(e, contextMenu.sessionId);
                                            setContextMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> 抹除记忆
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Center: Main Chat Area */}
            <div className="flex-1 glass-panel rounded-[2rem] border-white/40 dark:border-white/10 shadow-2xl flex flex-col min-w-0 h-full overflow-hidden bg-white/30 dark:bg-slate-900/30">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between shrink-0 bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                            className="p-2 -ml-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors lg:hidden inline-flex lg:!hidden"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                            className="hidden lg:inline-flex p-2 -ml-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            {leftSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg animation-pulse shadow-cyan-500/20 shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white truncate">{activeSession?.title || 'Loading...'}</h2>
                            <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                神经网关已连接
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href="/settings" className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors text-xs font-bold flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-800">
                            <Settings2 className="w-3.5 h-3.5" />
                            统一设置
                        </a>
                        <button
                            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                            className="p-2 -mr-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden xl:inline-flex"
                        >
                            {rightSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRight className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto w-full p-4 md:p-6 space-y-6 scroll-smooth no-scrollbar">
                    <AnimatePresence initial={false}>
                        {activeSession?.messages.map((msg, idx) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className={`flex gap-3 md:gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-blue-400'} border border-slate-100 dark:border-slate-700`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>

                                <div className={`relative max-w-[85%] whitespace-pre-wrap leading-relaxed px-5 py-3.5 rounded-[1.25rem] shadow-sm text-[15px] ${msg.role === 'user' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-100 rounded-tr-sm border border-indigo-100 dark:border-indigo-500/30' : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-700/50'}`}>
                                    {/* Render Attachments */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {msg.attachments.map((att, i) => (
                                                att.type === 'image' ? (
                                                    <img key={i} src={att.dataUrl} alt={att.name} className="h-24 w-auto object-cover rounded-xl border border-white/20 shadow-sm" />
                                                ) : (
                                                    <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                                                        <FileText className="w-4 h-4 text-indigo-500" />
                                                        <span className="truncate max-w-[150px] font-semibold">{att.name}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}
                                    <div className="font-medium text-[15px] max-w-full overflow-x-hidden">
                                        {msg.content ? (
                                            msg.role === 'user' ? (
                                                <span className="whitespace-pre-wrap">{msg.content}</span>
                                            ) : (
                                                <div className="space-y-1">
                                                    {parseMessageContent(msg.content).map((block, bIdx) => {
                                                        if (block.type === 'think') {
                                                            return <ThinkBlock key={bIdx} content={block.content} isStreaming={isReceiving && idx === activeSession.messages.length - 1} />
                                                        }
                                                        return <EnhancedMarkdown key={bIdx} content={block.content} />
                                                    })}
                                                </div>
                                            )
                                        ) : (
                                            isReceiving && idx === activeSession.messages.length - 1 && (
                                                <span className="animate-pulse flex items-center gap-1.5 h-6">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 delay-75"></span>
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 delay-150"></span>
                                                </span>
                                            )
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Chat Input */}
                <div className="p-4 md:p-5 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl shrink-0 z-20 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="max-w-3xl mx-auto relative group">
                        {/* Attachment Preview Bar */}
                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: 10, height: 0 }}
                                    className="flex flex-wrap gap-2 mb-3 px-2"
                                >
                                    {attachments.map(att => (
                                        <div key={att.id} className="relative group/att flex items-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden pr-8 h-14 hover:shadow-md transition-shadow">
                                            {att.type === 'image' ? (
                                                <img src={att.dataUrl} alt={att.name} className="h-full w-14 object-cover" />
                                            ) : (
                                                <div className="h-full w-14 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                            )}
                                            <span className="text-[13px] font-bold px-3 truncate max-w-[120px] text-slate-700 dark:text-slate-300">{att.name}</span>
                                            <button
                                                onClick={() => removeAttachment(att.id)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center opacity-0 group-hover/att:opacity-100 transition-opacity text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500 -z-10"></div>
                        <div className="relative flex items-end gap-2 bg-white dark:bg-slate-800 rounded-3xl p-2 pl-5 shadow-xl border border-slate-100 dark:border-slate-700">
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="输入消息 (Enter 发送, Shift+Enter 换行)..."
                                className="flex-1 bg-transparent py-3 max-h-32 min-h-[44px] outline-none font-medium placeholder:text-slate-400 resize-none no-scrollbar"
                                rows={1}
                            />
                            <div className="flex items-center gap-1 shrink-0 pb-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="image/*,.txt,.md,.csv"
                                    onChange={handleFileSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-indigo-500"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <button
                                    disabled={isReceiving || (!input.trim() && attachments.length === 0) || !activeSession}
                                    onClick={handleSend}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                                >
                                    {isReceiving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Context & Inspector */}
            <AnimatePresence initial={false}>
                {rightSidebarOpen && (
                    <motion.div
                        key="right-sidebar"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="hidden xl:flex flex-col glass-panel rounded-[2rem] border-white/40 dark:border-white/10 shadow-2xl overflow-hidden shrink-0 h-full bg-white/60 dark:bg-slate-900/60"
                    >
                        <div className="w-80 p-5 h-full flex flex-col space-y-6 shrink-0">
                            {/* Active Model Indicator */}
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Cpu className="w-4 h-4" /> 当前激活引擎
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeLlm ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                        {activeLlm?.format === 'anthropic' ? 'Anth' : activeLlm?.format === 'custom' ? 'Cust' : 'OAI'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{activeLlm?.name || '系统默认端点'}</div>
                                        <div className="text-xs font-medium text-slate-500 truncate">{activeLlm?.model || 'gpt-4o-mini (内置)'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Model Parameters */}
                            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4" /> 采样参数联调
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Temperature</label>
                                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{modelParams.temperature.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="2" step="0.01" value={modelParams.temperature}
                                            onChange={e => setModelParams(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                                            className="w-full accent-indigo-500"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                                            <span>严谨分析</span><span>发散创造</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Top-P</label>
                                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{modelParams.top_p.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="1" step="0.01" value={modelParams.top_p}
                                            onChange={e => setModelParams(prev => ({ ...prev, top_p: parseFloat(e.target.value) }))}
                                            className="w-full accent-purple-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* System Prompt Inspector */}
                            <div className="flex-1 flex flex-col min-h-0 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden shadow-indigo-500/10 relative">
                                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 z-10 shrink-0">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Eye className="w-4 h-4" /> 指令嗅探器
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${globalSettings.promptMode === 'custom' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                        {globalSettings.promptMode === 'custom' ? '独占模式' : '组合模式'}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar p-4 relative">
                                    <pre className="text-[11px] leading-relaxed font-mono text-emerald-400/90 whitespace-pre-wrap break-words z-0 relative">
                                        {currentSystemPrompt}
                                    </pre>
                                </div>
                                {/* Fading bottom edge */}
                                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
