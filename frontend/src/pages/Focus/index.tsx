import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Clock, Calendar, Sparkles, Coffee, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api from '@/lib/axios';

interface FocusTask {
    id: number;
    title: string;
    start_time: string;
    duration: number;
    date: string;
    completed: boolean;
    color: string;
}

export default function FocusPage() {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<FocusTask[]>([]);
    const [currentTask, setCurrentTask] = useState<FocusTask | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [completing, setCompleting] = useState(false);

    // Fetch Target Data
    const fetchData = async () => {
        try {
            const res = await api.get<FocusTask[]>('/study/tasks');
            const todayTasks = res.data.filter(t => t.date === new Date().toISOString().split('T')[0]);
            setTasks(todayTasks);
            setCurrentTask(todayTasks.find(t => !t.completed) || null);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            fetchData();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const fireConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
            zIndex: 9999
        });
    };

    const handleComplete = async () => {
        if (!currentTask || completing) return;
        setCompleting(true);
        fireConfetti();
        try {
            await api.patch(`/study/tasks/${currentTask.id}`, { completed: true });
        } catch (e) { }

        await new Promise(resolve => setTimeout(resolve, 800));
        setCompleting(false);
        fetchData();
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate approximate progress
    const getProgress = () => {
        if (!currentTask) return 0;
        const [hours, minutes] = currentTask.start_time.split(':').map(Number);
        const start = new Date(currentTime);
        start.setHours(hours, minutes, 0, 0);

        const end = new Date(start.getTime() + currentTask.duration * 60000);
        if (currentTime < start) return 0;
        if (currentTime > end) return 100;

        return ((currentTime.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
    };

    const formatRemainingTime = () => {
        if (!currentTask) return '00:00';
        const [hours, minutes] = currentTask.start_time.split(':').map(Number);
        const start = new Date(currentTime);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start.getTime() + currentTask.duration * 60000);

        if (currentTime > end) return '00:00';
        if (currentTime < start) return `${currentTask.duration}m 待命`;

        const remains = Math.ceil((end.getTime() - currentTime.getTime()) / 60000);
        return `${remains}m 剩余`;
    }

    const getTimelinePosition = () => {
        if (tasks.length === 0) return 50;
        const startTimes = tasks.map(t => { const parts = t.start_time.split(':'); return parseInt(parts[0]) * 60 + parseInt(parts[1]); });
        const endTimes = tasks.map((t, i) => startTimes[i] + t.duration);
        const minTime = Math.min(...startTimes);
        const maxTime = Math.max(...endTimes);

        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        if (currentMinutes < minTime) return 0;
        if (currentMinutes > maxTime) return 100;

        const position = ((currentMinutes - minTime) / (maxTime - minTime)) * 100;
        return Math.min(Math.max(position, 0), 100);
    };

    const timelinePosition = getTimelinePosition();

    return (
        <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-900 overflow-hidden selection:bg-purple-500/30">
            {/* Background Atmosphere */}
            <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[130px] pointer-events-none -z-10" />

            {/* Left Panel - Focus Center (70%) */}
            <div className="flex-[7] flex flex-col p-8 md:p-12 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 z-10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 transition-all font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        返回仪表盘
                    </button>
                    <div className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-md">
                        {formatTime(currentTime)}
                    </div>
                </div>

                {/* Main Focus Ring */}
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                    <AnimatePresence mode="wait">
                        {currentTask ? (
                            <motion.div
                                key={currentTask.id}
                                layoutId={`task-${currentTask.id}`}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                className="w-full max-w-2xl relative"
                            >
                                <div
                                    className="relative glass-panel rounded-[3rem] p-12 lg:p-16 shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden bg-white/40 dark:bg-slate-900/40"
                                >
                                    {/* Abstract Dial Graphic */}
                                    <div className="absolute inset-x-0 -top-24 h-48 opacity-20 pointer-events-none flex justify-center overflow-hidden">
                                        <div className="w-96 h-96 border-[40px] border-indigo-400 rounded-full blur-2xl Mix-blend-overlay"></div>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 font-bold tracking-widest text-xs uppercase shadow-inner" style={{ backgroundColor: `${currentTask.color}20`, color: currentTask.color }}>
                                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentTask.color }}></div>
                                            ONGOING DIRECTIVE
                                        </div>

                                        <h1 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tighter mb-8 leading-tight drop-shadow-sm">
                                            {currentTask.title}
                                        </h1>

                                        {/* Timer Clock */}
                                        <div className="flex items-center gap-4 mb-12 bg-white/60 dark:bg-slate-800/60 px-8 py-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 backdrop-blur-md">
                                            <Clock className="w-8 h-8 text-indigo-500" />
                                            <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
                                                {formatRemainingTime()}
                                            </span>
                                        </div>

                                        {/* Progress Bar Layer */}
                                        <div className="w-full h-4 bg-slate-200/50 dark:bg-slate-800/50 rounded-full mb-12 overflow-hidden shadow-inner relative">
                                            <motion.div
                                                className="absolute top-0 left-0 bottom-0"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${getProgress()}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                style={{ backgroundColor: currentTask.color }}
                                            />
                                            {/* Shimmer Effect */}
                                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] animate-[shimmer_2s_infinite]" />
                                        </div>

                                        <motion.button
                                            onClick={handleComplete}
                                            disabled={completing}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`inline-flex items-center justify-center gap-3 w-full max-w-sm py-5 rounded-[2rem] text-xl font-black tracking-tight transition-all duration-300 group
                                                ${completing ? 'bg-emerald-500 text-white shadow-emerald-500/50 shadow-2xl scale-110' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-2xl shadow-indigo-500/30'}
                                            `}
                                        >
                                            {completing ? (
                                                <><Sparkles className="w-7 h-7 animate-spin" /> 完成！</>
                                            ) : (
                                                <><Check className="w-7 h-7 group-hover:scale-125 transition-transform" /> 提交任务归档</>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                                <div className="w-40 h-40 mx-auto mb-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30 rotate-3 hover:rotate-6 transition-transform">
                                    <Coffee className="w-20 h-20 text-white" />
                                </div>
                                <h2 className="text-5xl font-black text-slate-800 dark:text-white mb-6 drop-shadow-md tracking-tighter">
                                    休整周期 ☕
                                </h2>
                                <p className="text-xl font-medium text-slate-500 dark:text-slate-400">
                                    所有序列完成。当前无待执行指令。
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Panel - Timeline Dock (30%) */}
            <div className="flex-[3] relative border-l border-slate-200/50 dark:border-slate-700/50 flex flex-col bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl shadow-[-20px_0_40px_rgba(0,0,0,0.02)] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.1)] z-20">
                <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <Target className="w-6 h-6 text-indigo-500" />
                        纪元时间轴
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-10 relative no-scrollbar">
                    {/* Living Time Indicator */}
                    <div
                        className="absolute left-8 right-8 h-[2px] bg-gradient-to-r from-red-500 to-transparent z-20 pointer-events-none transition-all duration-1000"
                        style={{ top: `${timelinePosition}%` }}
                    >
                        <div className="absolute -left-[5px] -top-[5px] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                        <span className="absolute left-6 -top-[14px] text-xs font-black text-red-500 tracking-wider">
                            当前游标
                        </span>
                    </div>

                    {/* Timeline Axis Line */}
                    <div className="absolute left-[38px] top-10 bottom-10 w-1 bg-slate-200 dark:bg-slate-700/50 rounded-full" />

                    {/* Nodes */}
                    <div className="space-y-4 relative">
                        {tasks.map((task) => {
                            const isPast = task.completed;
                            const isActive = currentTask?.id === task.id;

                            return (
                                <motion.div
                                    key={task.id}
                                    layoutId={`node-${task.id}`}
                                    className={`relative flex gap-6 pl-12 py-4 rounded-2xl transition-all duration-300
                                        ${isPast ? 'opacity-40 grayscale' : ''} 
                                        ${isActive ? 'bg-white/60 dark:bg-slate-800/60 shadow-xl border border-white/50 dark:border-white/10 scale-[1.02]' : 'hover:bg-white/40 dark:hover:bg-slate-800/40'}
                                    `}
                                >
                                    <div className={`absolute left-0 w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10 transform -translate-x-[4px]
                                        ${isPast ? 'bg-slate-300 dark:bg-slate-600 text-white' : 'text-white'} 
                                        ${isActive ? 'ring-4 ring-indigo-500/30' : ''}
                                    `} style={{ backgroundColor: isPast ? undefined : task.color }}>
                                        {isPast ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-sm font-black tracking-wider font-mono ${isPast ? 'line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {task.start_time}
                                            </span>
                                            {isActive && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">进行中</span>}
                                        </div>
                                        <h4 className={`text-lg font-bold tracking-tight mb-1 ${isPast ? 'line-through' : ''}`}>
                                            {task.title}
                                        </h4>
                                        <span className="text-sm font-semibold text-slate-500">
                                            定额 {task.duration} 分钟
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {tasks.length === 0 && (
                            <div className="text-center py-20 text-slate-400">
                                <Calendar className="w-16 h-16 mx-auto mb-6 opacity-30" />
                                <p className="font-bold text-lg">时间轴静默期</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
