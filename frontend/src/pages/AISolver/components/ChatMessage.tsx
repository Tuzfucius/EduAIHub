/**
 * ChatMessage - 聊天消息气泡组件
 */
import React, { useState, useMemo } from 'react';
import { User, Bot, Copy, Check, ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';
import { Message } from '@/services/chatService';
import { useTheme } from '@/contexts/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
    message: Message;
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
        return <code className={className}>{children}</code>;
    }

    return (
        <div className="my-3 shape-lg overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
            <div
                className="px-4 py-2 text-xs flex items-center justify-between"
                style={{
                    backgroundColor: 'var(--md-surface-container)',
                    color: 'var(--md-on-surface-variant)',
                }}
            >
                <span>{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 shape-sm hover:bg-white/10 transition-colors"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '已复制' : '复制'}</span>
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
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
                className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity mb-2"
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
                        remarkPlugins={[remarkGfm]}
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

export default function ChatMessage({ message }: ChatMessageProps) {
    const { getGradientStyle } = useTheme();
    const isUser = message.role === 'user';

    // 处理消息内容，分离思考过程
    const { thoughtContent, mainContent } = useMemo(() => {
        const text = message.content;

        // 匹配 <think>...</think> 标签，支持多行和非贪婪匹配
        // 注意：一些模型可能输出 <think> 但未闭合（流式传输中），需要处理
        const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/;
        const match = text.match(thinkRegex);

        if (match) {
            const thoughtContent = match[1].trim();
            const mainContent = text.replace(match[0], '').trim();
            return { thoughtContent, mainContent };
        }

        return { thoughtContent: '', mainContent: text };
    }, [message.content]);

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* 头像 */}
            <div
                className="w-8 h-8 shape-full flex items-center justify-center shrink-0"
                style={isUser ? getGradientStyle() : { backgroundColor: 'var(--md-secondary-container)' }}
            >
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4" style={{ color: 'var(--md-on-secondary-container)' }} />
                )}
            </div>

            {/* 消息内容 */}
            <div
                className={`max-w-[90%] md:max-w-[80%] px-4 py-3 shape-lg ${isUser ? 'shape-tr-none' : 'shape-tl-none'}`}
                style={{
                    backgroundColor: isUser
                        ? 'var(--md-primary-container)'
                        : 'var(--md-surface-container)',
                    color: isUser
                        ? 'var(--md-on-primary-container)'
                        : 'var(--md-on-surface)',
                }}
            >

                {/* 图片附件展示 */}
                {message.images && message.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {message.images.map((img, i) => (
                            <img
                                key={i}
                                src={img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`}
                                alt="attachment"
                                className="max-w-full max-h-64 object-contain rounded-lg border border-black/10 dark:border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`)}
                            />
                        ))}
                    </div>
                )}

                {!isUser && thoughtContent && (
                    <ThinkingBlock content={thoughtContent} />
                )}

                <div className="prose prose-sm max-w-none dark:prose-invert">
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        <>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code: CodeBlock as any,
                                    // 确保链接在新标签页打开
                                    a: ({ node, ...props }) => (
                                        <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--md-primary)' }} />
                                    ),
                                    table: ({ node, ...props }) => (
                                        <div className="my-4 overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-200 dark:border-gray-700" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => <thead className="bg-black/5 dark:bg-white/5" {...props} />,
                                    th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-sm font-semibold" {...props} />,
                                    td: ({ node, ...props }) => <td className="px-3 py-2 text-sm border-t border-gray-200 dark:border-gray-700" {...props} />,
                                }}
                            >
                                {mainContent || (message.isStreaming ? '...' : '')}
                                {/* 如果 mainContent 为空且正在流式传输，可能正在输出 thinking，或者刚开始 */}
                            </ReactMarkdown>
                            {message.isStreaming && !mainContent && !thoughtContent && (
                                <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{ backgroundColor: 'var(--md-primary)' }} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
