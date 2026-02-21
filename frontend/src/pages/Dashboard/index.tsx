import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Clock, Calendar, Check, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/lib/axios';

// TypeScript Interfaces
interface Course {
    id: number;
    title: string;
    chapter?: string;
    progress: number;
    icon: string;
    color: string;
}

interface FocusTask {
    id: number;
    title: string;
    start_time: string;
    duration: number;
    date: string;
    completed: boolean;
    color: string;
}

// Animation Variants
const containerVariant = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [courses, setCourses] = useState<Course[]>([]);
    const [tasks, setTasks] = useState<FocusTask[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        setIsRefreshing(true);
        try {
            const [coursesRes, tasksRes] = await Promise.all([
                api.get<Course[]>('/study/courses'),
                api.get<FocusTask[]>('/study/tasks')
            ]);
            setCourses(coursesRes.data);
            setTasks(tasksRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCompleteTask = async (id: number) => {
        try {
            await api.patch(`/study/tasks/${id}`, { completed: true });
            fetchData(); // 重新加载获取最新状态
        } catch (e) {
            console.error(e);
        }
    };

    const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
    const activeTask = todayTasks.find(t => !t.completed);

    return (
        <div className="min-h-screen relative p-4 md:p-8 xl:p-12 pb-24">
            {/* Neo-brutalism Orbs */}
            <div className="fixed top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[150px] pointer-events-none -z-10" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[150px] pointer-events-none -z-10" />

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-12 glass-panel px-6 py-4 rounded-3xl"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/30">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">你好, {user?.username}</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                    </button>
                    <button
                        onClick={logout}
                        className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </motion.header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
                {/* Main Content (Left) */}
                <div className="xl:col-span-8 flex flex-col gap-8">

                    {/* Active Focus Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, type: "spring" }}
                        className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 shadow-2xl glass-panel border-white/40 dark:border-white/10"
                        style={{
                            background: activeTask ? `linear-gradient(135deg, ${activeTask.color}ee 0%, ${activeTask.color}99 100%)` : 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(168, 85, 247, 0.8) 100%)'
                        }}
                    >
                        <div className="absolute inset-0 bg-noise opacity-20 mix-blend-overlay"></div>

                        <div className="relative z-10 text-white flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-6 font-semibold tracking-wide text-sm shadow-inner">
                                    <Target className="w-4 h-4" /> 当前焦点使命
                                </div>

                                {activeTask ? (
                                    <>
                                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight drop-shadow-md">
                                            {activeTask.title}
                                        </h2>
                                        <div className="flex items-center gap-4 font-medium text-white/90">
                                            <span className="flex items-center gap-1.5 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md">
                                                <Clock className="w-4 h-4" /> {activeTask.start_time} 开始
                                            </span>
                                            <span className="bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md">
                                                {activeTask.duration} 分钟
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md">
                                            太棒了！<br />今日行程已全部搞定。
                                        </h2>
                                        <p className="text-white/80 text-lg font-medium">你可以享受闲暇，或者添加新的目标。</p>
                                    </>
                                )}
                            </div>

                            {activeTask && (
                                <button
                                    onClick={() => handleCompleteTask(activeTask.id)}
                                    className="w-20 h-20 rounded-[1.5rem] bg-white text-black shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
                                >
                                    <Check className="w-10 h-10 group-hover:text-emerald-500 transition-colors" />
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Courses Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-2xl font-extrabold tracking-tight">所有课程</h3>
                        </div>

                        <motion.div
                            variants={containerVariant}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {courses.map(course => (
                                <motion.div
                                    key={course.id}
                                    variants={itemVariant}
                                    className="glass-panel p-6 rounded-[2rem] hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-white/50 dark:border-white/10"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: course.color }} />
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all" style={{ backgroundColor: `${course.color}15`, color: course.color }}>
                                            {course.icon}
                                        </div>
                                        <span className="text-sm font-black px-4 py-1.5 rounded-full" style={{ backgroundColor: `${course.color}15`, color: course.color }}>
                                            {course.progress}%
                                        </span>
                                    </div>
                                    <h4 className="text-xl font-bold mb-1 tracking-tight truncate">{course.title}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6 line-clamp-1">{course.chapter || "暂无进度描述"}</p>

                                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: course.color }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                </div>

                {/* Sidebar (Right) */}
                <div className="xl:col-span-4 flex flex-col gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel rounded-[2.5rem] p-8 border-white/50 dark:border-white/10 shadow-xl flex-1 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-purple-500" />今日清单
                            </h3>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-4 pr-2">
                            {todayTasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-40">
                                    <Target className="w-16 h-16 mb-4" />
                                    <p className="font-bold">今日很轻松</p>
                                </div>
                            ) : (
                                todayTasks.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + (i * 0.1) }}
                                        className={`group relative p-4 rounded-3xl border transition-all duration-300 flex items-center gap-4 
                          ${task.completed ? 'bg-slate-50/50 dark:bg-slate-800/20 border-transparent grayscale opacity-60' : 'bg-white/60 dark:bg-slate-800/60 border-white/50 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-1'}`}
                                    >
                                        <div className="w-1.5 h-12 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                                        <div className="flex-1 min-w-0 py-1">
                                            <p className={`font-bold truncate text-base ${task.completed ? 'line-through' : ''}`}>
                                                {task.title}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {task.start_time} - {task.duration}m
                                            </p>
                                        </div>
                                        {!task.completed && (
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-green-100"
                                            >
                                                <Check className="w-5 h-5 stroke-[3]" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <button className="btn-premium mt-4 w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold tracking-wide shadow-lg flex items-center justify-center gap-2">
                            <span className="text-xl leading-none">+</span> 添加新日程
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
