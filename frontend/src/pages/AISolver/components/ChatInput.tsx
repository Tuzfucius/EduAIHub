/**
 * ChatInput - 聊天输入框组件
 */
import React, { useRef, useEffect, KeyboardEvent } from 'react';
import { Send, StopCircle, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStop: () => void;
    isLoading: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatInput({
    value,
    onChange,
    onSend,
    onStop,
    isLoading,
    disabled = false,
    placeholder = '输入问题，按 Enter 发送...',
}: ChatInputProps) {
    const { getGradientStyle } = useTheme();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 自动调整高度
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 200);
            textarea.style.height = `${newHeight}px`;
        }
    }, [value]);

    // 处理键盘事件
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && value.trim() && !disabled) {
                onSend();
            }
        }
    };

    const canSend = value.trim() && !isLoading && !disabled;

    return (
        <div
            className="p-4"
            style={{
                backgroundColor: 'var(--md-surface-container-low)',
                borderTop: '1px solid var(--md-outline-variant)',
            }}
        >
            <div
                className="flex items-end gap-3 p-3 shape-xl elevation-1"
                style={{ backgroundColor: 'var(--md-surface)' }}
            >
                {/* 输入框 */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading || disabled}
                        rows={1}
                        className="w-full resize-none outline-none text-base leading-relaxed"
                        style={{
                            backgroundColor: 'transparent',
                            color: 'var(--md-on-surface)',
                            maxHeight: '200px',
                            minHeight: '24px',
                        }}
                    />
                </div>

                {/* 发送/停止按钮 */}
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="w-10 h-10 shape-full flex items-center justify-center shrink-0 transition-all hover:scale-105"
                        style={{
                            backgroundColor: 'var(--md-error)',
                            color: 'var(--md-on-error)',
                        }}
                        title="停止生成"
                    >
                        <StopCircle className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={onSend}
                        disabled={!canSend}
                        className="w-10 h-10 shape-full flex items-center justify-center shrink-0 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        style={canSend ? getGradientStyle() : { backgroundColor: 'var(--md-surface-container-highest)' }}
                        title="发送消息 (Enter)"
                    >
                        <Send className="w-5 h-5 text-white" style={!canSend ? { color: 'var(--md-on-surface-variant)' } : undefined} />
                    </button>
                )}
            </div>

            {/* 提示文字 */}
            <div
                className="flex items-center justify-center gap-2 mt-2 text-xs"
                style={{ color: 'var(--md-on-surface-variant)' }}
            >
                <Sparkles className="w-3 h-3" />
                <span>Shift + Enter 换行，Enter 发送</span>
            </div>
        </div>
    );
}
