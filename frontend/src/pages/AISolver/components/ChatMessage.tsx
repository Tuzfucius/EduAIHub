/**
 * ChatMessage - 聊天消息气泡组件
 */
import React, { useState, useMemo } from 'react';
import { User, Bot, Copy, Check, ChevronDown, ChevronRight, BrainCircuit, Pencil, Trash2, RefreshCw, Save } from 'lucide-react';
import { Message } from '@/services/chatService';
import { useTheme } from '@/contexts/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatMessageProps {
    message: Message;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, newContent: string) => void;
    onRegenerate?: (id: string) => void;
}

// 代码块组件
const CodeBlock = React.memo(({ children, className }: { children: React.ReactNode; className?: string }) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!match) {
        return <code className={`${className} bg-black/5 dark:bg-white/10 rounded px-1.5 py-0.5 font-mono text-sm`}>{children}</code>;
    }

    return (
        <div className="my-4 rounded-xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
            <div
                className="px-4 py-2 text-xs flex items-center justify-between border-b border-black/5 dark:border-white/5"
                style={{
                    backgroundColor: 'var(--md-surface-container)',
                    color: 'var(--md-on-surface-variant)',
                }}
            >
                <span className="font-mono font-medium">{language || 'text'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制'}</span>
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                <code className={className} style={{ color: 'var(--md-on-surface)' }}>{children}</code>
            </pre>
        </div>
    );
});

// 思考过程组件
const ThinkingBlock = ({ content }: { content: string }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="mb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity mb-2 select-none"
                style={{ color: 'var(--md-primary)' }}
            >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <BrainCircuit className="w-4 h-4" />
                <span>思考过程</span>
            </button>
            {expanded && (
                <div
                    className="pl-4 border-l-2 text-sm opacity-80"
                    style={{
                        borderColor: 'var(--md-primary-container)',
                        color: 'var(--md-on-surface-variant)'
                    }}
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            code: CodeBlock as any
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default function ChatMessage({ message, onDelete, onEdit, onRegenerate }: ChatMessageProps) {
    const { getGradientStyle } = useTheme();
    const isUser = message.role === 'user';
    const [isHovering, setIsHovering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [isCopied, setIsCopied] = useState(false);

    // 处理消息内容，分离思考过程
    const { thoughtContent, mainContent } = useMemo(() => {
        const text = message.content;
        const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
        const match = text.match(thinkRegex);

        if (match) {
            const thoughtContent = match[1].trim();
            const mainContent = text.replace(match[0], '').trim();
            return { thoughtContent, mainContent };
        }

        return { thoughtContent: '', mainContent: text };
    }, [message.content]);

    // 复制消息
    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // 保存编辑
    const handleSaveEdit = () => {
        if (editContent.trim() !== message.content) {
            onEdit?.(message.id, editContent);
        }
        setIsEditing(false);
    };

    return (
        <div
            className={`flex gap-4 group/message ${isUser ? 'flex-row-reverse' : ''} max-w-4xl mx-auto w-full`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* 头像 */}
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border border-black/5 dark:border-white/5"
                style={isUser ? getGradientStyle() : { backgroundColor: 'var(--md-secondary-container)' }}
            >
                {isUser ? (
                    <User className="w-5 h-5 text-white" />
                ) : (
                    <Bot className="w-5 h-5" style={{ color: 'var(--md-on-secondary-container)' }} />
                )}
            </div>

            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* 消息气泡 - Cherry Studio 风格优化 */}
                <div
                    className={`px-6 py-4 rounded-2xl shadow-sm ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'} w-full text-base leading-relaxed tracking-wide`}
                    style={{
                        backgroundColor: isUser
                            ? 'var(--md-primary-container)'
                            : 'var(--md-surface-container)',
                        color: isUser
                            ? 'var(--md-on-primary-container)'
                            : 'var(--md-on-surface)',
                    }}
                >
                    {isEditing ? (
                        <div className="w-full">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-black/5 dark:bg-white/10 p-3 rounded-xl outline-none resize-none text-base leading-relaxed font-sans"
                                rows={Math.max(3, editContent.split('\n').length)}
                                style={{ color: 'inherit' }}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-1.5 text-sm rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-medium"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-1.5 text-sm rounded-full bg-primary text-white flex items-center gap-1.5 shadow-sm hover:shadow transition-all font-medium"
                                    style={getGradientStyle()}
                                >
                                    <Save className="w-4 h-4" />
                                    保存并发送
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 图片附件展示 */}
                            {message.images && message.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {message.images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`}
                                            alt="attachment"
                                            className="max-w-full max-h-72 object-contain rounded-xl border border-black/10 dark:border-white/10 cursor-pointer hover:opacity-90 transition-opacity shadow-sm bg-white/50 dark:bg-black/50"
                                            onClick={() => window.open(img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`)}
                                        />
                                    ))}
                                </div>
                            )}

                            {!isUser && thoughtContent && (
                                <ThinkingBlock content={thoughtContent} />
                            )}

                            <div className="prose prose-base max-w-none dark:prose-invert break-words">
                                {isUser ? (
                                    <p className="whitespace-pre-wrap font-sans">{message.content}</p>
                                ) : (
                                    <>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                code: CodeBlock as any,
                                                a: ({ node, ...props }) => (
                                                    <a {...props} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-primary/30 hover:decoration-primary transition-colors" style={{ color: 'var(--md-primary)' }} />
                                                ),
                                                p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed tracking-wide" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1 marker:text-primary/50" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1 marker:text-primary/50" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-1 leading-relaxed" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6 border-b pb-2 border-black/10 dark:border-white/10" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 mt-4" {...props} />,
                                                blockquote: ({ node, ...props }) => (
                                                    <blockquote className="border-l-4 pl-4 py-1 my-4 italic bg-black/5 dark:bg-white/5 rounded-r-lg" style={{ borderColor: 'var(--md-primary)' }} {...props} />
                                                ),
                                                table: ({ node, ...props }) => (
                                                    <div className="my-6 overflow-x-auto rounded-xl border border-black/10 dark:border-white/10 shadow-sm bg-black/5 dark:bg-white/5">
                                                        <table className="min-w-full divide-y divide-black/10 dark:divide-white/10" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className="bg-black/5 dark:bg-white/5" {...props} />,
                                                th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-sm font-semibold opacity-90" {...props} />,
                                                td: ({ node, ...props }) => <td className="px-4 py-3 text-sm border-t border-black/5 dark:border-white/5 opacity-80" {...props} />,
                                                hr: ({ node, ...props }) => <hr className="my-6 border-black/10 dark:border-white/10" {...props} />,
                                            }}
                                        >
                                            {mainContent || (message.isStreaming ? '...' : '')}
                                        </ReactMarkdown>
                                        {message.isStreaming && !mainContent && !thoughtContent && (
                                            <span className="inline-block w-2 h-4 ml-1 animate-pulse rounded-full" style={{ backgroundColor: 'var(--md-primary)' }} />
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* 操作栏 - 移动到右下角或左下角 */}
                {!isEditing && !message.isStreaming && (
                    <div
                        className={`flex items-center gap-2 mt-1 px-2 transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            title="复制"
                        >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {isUser ? (
                            <button
                                onClick={() => {
                                    setEditContent(message.content);
                                    setIsEditing(true);
                                }}
                                className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                title="编辑"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => onRegenerate?.(message.id)}
                                className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                title="重新生成"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        )}

                        <button
                            onClick={() => onDelete?.(message.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                            title="删除"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
