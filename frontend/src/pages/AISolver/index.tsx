import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, Paperclip } from 'lucide-react';
import api from '@/lib/axios';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export default function AISolverPage() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'assistant', content: '# 👋 欢迎来到 EduAI 行星解答中心\n\n有什么我可以协助您的数学推导或概念解析吗？我随时准备响应。' }
    ]);
    const [input, setInput] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isReceiving]);

    const handleSend = async () => {
        if (!input.trim() || isReceiving) return;

        const newMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setIsReceiving(true);

        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: 'assistant', content: '' }]);

        try {
            const chatHistory = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: newMsg.content });
            // 获取当前用户 Token 用于流式请求
            const token = localStorage.getItem('eduaihub_token');

            const res = await fetch('/api/v1/ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini", // Or whatever model in backend
                    messages: chatHistory,
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
                                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: currentResponse } : m));
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (e) {
            setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: '📡 [星际通讯中断] 后端大模型线路异常，请检查网关密钥配置。' } : m));
        } finally {
            setIsReceiving(false);
        }
    };

    return (
        <div className="h-screen w-full flex flex-col pt-4 pr-4 pl-4 sm:pl-0 pb-4 md:pb-20 lg:pb-4 relative">
            {/* Background Orbs */}
            <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-[20%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none -z-10" />

            <div className="glass-panel rounded-[2rem] border-white/40 dark:border-white/10 shadow-2xl flex flex-col flex-1 overflow-hidden h-full">

                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between shrink-0 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg animation-pulse shadow-cyan-500/20">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">智能推演网络 (Solver)</h2>
                            <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                极速连接在线
                            </p>
                        </div>
                    </div>

                    <button className="px-4 py-2 rounded-xl bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 transition-all font-semibold text-sm flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700">
                        <Sparkles className="w-4 h-4 text-amber-500" /> 新思维导图
                    </button>
                </div>

                {/* Chat Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto w-full p-4 md:p-8 space-y-8 scroll-smooth no-scrollbar"
                >
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${msg.role === 'user' ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-blue-400'} border border-slate-100 dark:border-slate-700`}>
                                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>

                                <div className={`relative max-w-[80%] whitespace-pre-wrap leading-relaxed px-6 py-4 rounded-[1.5rem] shadow-sm font-medium ${msg.role === 'user' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-100 rounded-tr-sm border border-indigo-100 dark:border-indigo-500/30' : 'bg-white/80 dark:bg-slate-800/80 rounded-tl-sm border border-slate-100 dark:border-slate-700/50'}`}>
                                    {msg.content || (isReceiving && idx === messages.length - 1 && <span className="animate-pulse flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="w-2 h-2 rounded-full bg-blue-500 delay-75"></span><span className="w-2 h-2 rounded-full bg-blue-500 delay-150"></span></span>)}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Input Box */}
                <div className="p-4 md:p-6 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl shrink-0 z-20 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="max-w-4xl mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur opacity-25 group-focus-within:opacity-50 transition-opacity duration-500"></div>
                        <div className="relative flex items-center gap-2 bg-white dark:bg-slate-800 rounded-3xl p-2 pl-6 shadow-xl border border-slate-100 dark:border-slate-700">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="向核心矩阵发送你的疑问（例如：解释微积分基本定理的推导）..."
                                className="flex-1 bg-transparent py-3 outline-none font-medium placeholder:text-slate-400"
                            />
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <button
                                disabled={isReceiving || !input.trim()}
                                onClick={handleSend}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                            >
                                {isReceiving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-400 font-semibold mt-4">AI 可能会产生幻觉。请根据需求自行验证生成的内容逻辑。</p>
                </div>

            </div>
        </div>
    );
}
