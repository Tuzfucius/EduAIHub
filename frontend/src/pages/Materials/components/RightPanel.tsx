
import React, { useState, useRef, useEffect } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import { ragService } from '@/services/ragService';
import { Message } from '@/services/chatService';
import ChatInput from '@/pages/AISolver/components/ChatInput';
import ChatMessage from '@/pages/AISolver/components/ChatMessage';
import { Bot, Sparkles } from 'lucide-react';

export default function RightPanel() {
    const { currentKb, previewFile, pendingMessage, setPendingMessage } = useStudyStore();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '你好！我是你的 AI 助教。请在左侧选择知识库，或者直接向我提问。',
            createdAt: Date.now()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle cross-panel messages
    useEffect(() => {
        if (pendingMessage) {
            handleSend(undefined, pendingMessage);
            setPendingMessage(null);
        }
    }, [pendingMessage]);

    const handleSend = async (attachments?: string[], textOverride?: string) => {
        const textToSend = textOverride || input;

        if ((!textToSend.trim() && (!attachments || attachments.length === 0)) || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            images: attachments,
            createdAt: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput(""); // Always clear input even if override used
        setIsLoading(true);

        try {
            if (!currentKb) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: '请先选择一个知识库，我才能为您提供基于资料的回答。',
                        createdAt: Date.now()
                    }]);
                    setIsLoading(false);
                }, 500);
                return;
            }

            // Prepare history (last 5 messages)
            const history = messages.slice(-5).map(m => m.content);

            // Add context if previewing file
            let question = userMsg.content;
            if (previewFile) {
                question = `[Current Context: User is reading file "${previewFile.filename}"]\n${question}`;
            }

            const res = await ragService.query(currentKb.id, question, history);

            let botContent = res.answer;
            if (res.rejected) {
                botContent = "（抱歉，我在知识库中未找到相关答案）\n" + botContent;
            }

            // Append references
            if (res.references && res.references.length > 0) {
                botContent += "\n\n---\n**参考来源**:\n";
                res.references.forEach((ref, idx) => {
                    botContent += `${idx + 1}. **${ref.filename}**\n`;
                    if (ref.content) {
                        // Limit snippet length
                        const snippet = ref.content.length > 100 ? ref.content.substring(0, 100) + '...' : ref.content;
                        botContent += `> ${snippet}\n\n`;
                    }
                });
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: botContent,
                createdAt: Date.now()
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (e) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '抱歉，服务暂时不可用，请稍后重试。',
                createdAt: Date.now()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = () => {
        // Not actual stop implemented for non-stream
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--md-surface)]">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center gap-2 font-medium shadow-sm z-10">
                <Bot className="w-5 h-5 text-[var(--md-primary)]" />
                <span>AI 助教</span>
                {currentKb && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">{currentKb.name}</span>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map(msg => (
                    <ChatMessage
                        key={msg.id}
                        message={msg}
                        onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
                        onRegenerate={(id) => {
                            // Find message index
                            const idx = messages.findIndex(m => m.id === id);
                            if (idx > 0 && messages[idx].role === 'assistant') {
                                // Regenerate based on previous user message
                                const userMsg = messages[idx - 1];
                                if (userMsg.role === 'user') {
                                    // Remove this bot message
                                    setMessages(prev => prev.filter(m => m.id !== id));
                                    // Trigger send logic again (mock call)
                                    // Since handleSend clears input, we need to adapt handleSend or just call logic
                                    // For simplicity in this panel, just delete for now.
                                }
                            }
                        }}
                    />
                ))}

                {isLoading && (
                    <div className="flex gap-4 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-[var(--md-secondary-container)] flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-[var(--md-surface-container)] rounded-tl-sm flex items-center gap-2">
                            <span className="w-2 h-2 bg-[var(--md-primary)] rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-[var(--md-primary)] rounded-full animate-bounce delay-100" />
                            <span className="w-2 h-2 bg-[var(--md-primary)] rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="mt-auto">
                <ChatInput
                    value={input}
                    onChange={setInput}
                    onSend={(imgs) => handleSend(imgs)}
                    onStop={handleStop}
                    isLoading={isLoading}
                    placeholder="遇到不懂的问题？随时问我..."
                />
            </div>
        </div>
    );
}
