/**
 * ChatMessage - 聊天消息气泡组件
 */
import React, { useState } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '@/services/chatService';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatMessageProps {
    message: Message;
}

// 简单的 Markdown 渲染（处理代码块、加粗、链接等）
function renderMarkdown(content: string): React.ReactNode {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];
    let key = 0;

    const processInlineMarkdown = (text: string): React.ReactNode => {
        // 处理行内代码
        const parts = text.split(/(`[^`]+`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('`') && part.endsWith('`')) {
                return (
                    <code
                        key={i}
                        className="px-1.5 py-0.5 text-sm shape-sm font-mono"
                        style={{ backgroundColor: 'var(--md-surface-container-highest)' }}
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }
            // 处理加粗
            const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
            return boldParts.map((bp, j) => {
                if (bp.startsWith('**') && bp.endsWith('**')) {
                    return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>;
                }
                return bp;
            });
        });
    };

    for (const line of lines) {
        // 代码块开始
        if (line.startsWith('```') && !inCodeBlock) {
            inCodeBlock = true;
            codeLanguage = line.slice(3).trim();
            codeContent = [];
            continue;
        }

        // 代码块结束
        if (line.startsWith('```') && inCodeBlock) {
            inCodeBlock = false;
            elements.push(
                <CodeBlock key={key++} language={codeLanguage} code={codeContent.join('\n')} />
            );
            codeLanguage = '';
            codeContent = [];
            continue;
        }

        // 代码块内容
        if (inCodeBlock) {
            codeContent.push(line);
            continue;
        }

        // 标题
        if (line.startsWith('### ')) {
            elements.push(
                <h3 key={key++} className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--md-on-surface)' }}>
                    {processInlineMarkdown(line.slice(4))}
                </h3>
            );
            continue;
        }
        if (line.startsWith('## ')) {
            elements.push(
                <h2 key={key++} className="text-xl font-semibold mt-4 mb-2" style={{ color: 'var(--md-on-surface)' }}>
                    {processInlineMarkdown(line.slice(3))}
                </h2>
            );
            continue;
        }
        if (line.startsWith('# ')) {
            elements.push(
                <h1 key={key++} className="text-2xl font-bold mt-4 mb-2" style={{ color: 'var(--md-on-surface)' }}>
                    {processInlineMarkdown(line.slice(2))}
                </h1>
            );
            continue;
        }

        // 列表项
        if (line.match(/^[-*]\s/)) {
            elements.push(
                <li key={key++} className="ml-4 list-disc" style={{ color: 'var(--md-on-surface)' }}>
                    {processInlineMarkdown(line.slice(2))}
                </li>
            );
            continue;
        }

        // 数字列表
        if (line.match(/^\d+\.\s/)) {
            const match = line.match(/^(\d+)\.\s(.*)$/);
            if (match) {
                elements.push(
                    <li key={key++} className="ml-4 list-decimal" style={{ color: 'var(--md-on-surface)' }}>
                        {processInlineMarkdown(match[2])}
                    </li>
                );
            }
            continue;
        }

        // 空行
        if (line.trim() === '') {
            elements.push(<div key={key++} className="h-2" />);
            continue;
        }

        // 普通段落
        elements.push(
            <p key={key++} className="leading-relaxed" style={{ color: 'var(--md-on-surface)' }}>
                {processInlineMarkdown(line)}
            </p>
        );
    }

    // 处理未结束的代码块
    if (inCodeBlock && codeContent.length > 0) {
        elements.push(
            <CodeBlock key={key++} language={codeLanguage} code={codeContent.join('\n')} />
        );
    }

    return elements;
}

// 代码块组件
function CodeBlock({ language, code }: { language: string; code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 shape-lg overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
            <div
                className="px-4 py-2 text-xs flex items-center justify-between"
                style={{
                    backgroundColor: 'var(--md-surface-container)',
                    color: 'var(--md-on-surface-variant)',
                }}
            >
                <span>{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 shape-sm hover:bg-white/10 transition-colors"
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? '已复制' : '复制'}</span>
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
                <code style={{ color: 'var(--md-on-surface)' }}>{code}</code>
            </pre>
        </div>
    );
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const { getGradientStyle } = useTheme();
    const isUser = message.role === 'user';

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
                className={`max-w-[80%] px-4 py-3 shape-lg ${isUser ? 'shape-tr-none' : 'shape-tl-none'}`}
                style={{
                    backgroundColor: isUser
                        ? 'var(--md-primary-container)'
                        : 'var(--md-surface-container)',
                }}
            >
                {isUser ? (
                    <p style={{ color: 'var(--md-on-primary-container)' }}>{message.content}</p>
                ) : (
                    <div className="prose prose-sm max-w-none">
                        {renderMarkdown(message.content)}
                        {message.isStreaming && (
                            <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{ backgroundColor: 'var(--md-primary)' }} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
