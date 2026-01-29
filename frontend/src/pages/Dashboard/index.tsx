/**
 * Dashboard 仪表盘 - Material Design 3 风格
 */
import React, { useState, useEffect } from 'react';
import {
    LogOut, Moon, Sun, BookOpen, Target, Clock,
    ChevronRight, ChevronLeft, Plus, Calendar,
    TrendingUp, Sparkles, GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 模拟数据类型
interface Course {
    id: string;
    title: string;
    chapter: string;
    progress: number;
    icon: string;
    color: string;
}

interface Task {
    id: string;
    title: string;
    time: string;
    duration: number;
    completed: boolean;
    color: string;
}

// 模拟数据
const mockCourses: Course[] = [
    { id: '1', title: '高等数学', chapter: '第5章 偏微分方程', progress: 85, icon: '∑', color: '#6750A4' },
    { id: '2', title: '数据结构', chapter: '第3章 二叉树与堆', progress: 42, icon: '{}', color: '#7D5260' },
    { id: '3', title: '线性代数', chapter: '第4章 特征值与特征向量', progress: 68, icon: '⊕', color: '#625B71' },
];

const mockTasks: Task[] = [
    { id: '1', title: '复习高等数学第五章', time: '09:00', duration: 60, completed: false, color: '#6750A4' },
    { id: '2', title: '完成数据结构作业', time: '14:00', duration: 90, completed: false, color: '#7D5260' },
    { id: '3', title: '预习线性代数', time: '16:00', duration: 45, completed: true, color: '#625B71' },
];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [isDark, setIsDark] = useState(false);
    const [currentDate] = useState(new Date());
    const [courses] = useState<Course[]>(mockCourses);
    const [tasks] = useState<Task[]>(mockTasks);

    // 日历状态
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // 生成日历天数
    const getCalendarDays = () => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // 上个月的天数
        const startDay = firstDay.getDay() || 7;
        for (let i = startDay - 1; i > 0; i--) {
            days.push({
                date: new Date(year, month, 1 - i),
                isCurrentMonth: false,
            });
        }

        // 当月天数
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true,
            });
        }

        // 下个月的天数
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
            });
        }

        return days;
    };

    const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const today = formatDate(new Date());

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: 'var(--md-surface)' }}
        >
            {/* 顶部应用栏 */}
            <header
                className="h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-10 elevation-1"
                style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 shape-md flex items-center justify-center"
                        style={{ backgroundColor: 'var(--md-primary-container)' }}
                    >
                        <GraduationCap className="w-5 h-5" style={{ color: 'var(--md-on-primary-container)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-medium" style={{ color: 'var(--md-on-surface)' }}>
                            EduAIHub
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* 主题切换 */}
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="w-10 h-10 shape-full flex items-center justify-center state-layer"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* 用户头像 */}
                    <div
                        className="flex items-center gap-3 px-3 py-2 shape-full"
                        style={{ backgroundColor: 'var(--md-surface-container-high)' }}
                    >
                        <div
                            className="w-8 h-8 shape-full flex items-center justify-center text-sm font-medium"
                            style={{
                                backgroundColor: 'var(--md-tertiary-container)',
                                color: 'var(--md-on-tertiary-container)',
                            }}
                        >
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                            className="hidden md:block text-sm font-medium"
                            style={{ color: 'var(--md-on-surface)' }}
                        >
                            {user?.name}
                        </span>
                    </div>

                    {/* 登出按钮 */}
                    <button
                        onClick={logout}
                        className="w-10 h-10 shape-full flex items-center justify-center state-layer"
                        style={{ color: 'var(--md-error)' }}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* 主内容区 */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* 欢迎语 */}
                    <div className="mb-6">
                        <h2
                            className="text-2xl md:text-3xl font-medium mb-1"
                            style={{ color: 'var(--md-on-surface)' }}
                        >
                            欢迎回来，{user?.name}！
                        </h2>
                        <p style={{ color: 'var(--md-on-surface-variant)' }}>
                            {currentDate.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* 统计卡片 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            icon={<BookOpen className="w-5 h-5" />}
                            label="进行中课程"
                            value={courses.length.toString()}
                            color="primary"
                        />
                        <StatCard
                            icon={<Target className="w-5 h-5" />}
                            label="今日任务"
                            value={`${completedTasks}/${totalTasks}`}
                            color="tertiary"
                        />
                        <StatCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            label="本周学习"
                            value="12.5h"
                            color="secondary"
                        />
                        <StatCard
                            icon={<Sparkles className="w-5 h-5" />}
                            label="连续天数"
                            value="7"
                            color="primary"
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* 左侧：课程和今日专注 */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* 今日专注卡片 */}
                            <div
                                className="p-6 shape-xl"
                                style={{
                                    background: 'linear-gradient(135deg, var(--md-primary) 0%, var(--md-tertiary) 100%)',
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-white/90">
                                        <Target className="w-5 h-5" />
                                        <span className="font-medium">今日专注</span>
                                    </div>
                                    <button
                                        className="px-4 py-2 shape-full text-sm font-medium"
                                        style={{
                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                        }}
                                    >
                                        查看全部
                                    </button>
                                </div>

                                {tasks.filter(t => !t.completed)[0] ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-medium text-white mb-2">
                                                {tasks.filter(t => !t.completed)[0].title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-white/80 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {tasks.filter(t => !t.completed)[0].time}
                                                </span>
                                                <span>{tasks.filter(t => !t.completed)[0].duration} 分钟</span>
                                            </div>
                                        </div>
                                        <button
                                            className="w-14 h-14 shape-lg flex items-center justify-center elevation-2"
                                            style={{
                                                backgroundColor: 'white',
                                                color: 'var(--md-primary)',
                                            }}
                                        >
                                            <Sparkles className="w-6 h-6" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-white/80 mb-3">🎉 所有任务已完成！</p>
                                        <button
                                            className="px-6 py-2 shape-full text-sm font-medium flex items-center gap-2 mx-auto"
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.2)',
                                                color: 'white',
                                            }}
                                        >
                                            <Plus className="w-4 h-4" />
                                            添加任务
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 课程列表 */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3
                                        className="text-lg font-medium"
                                        style={{ color: 'var(--md-on-surface)' }}
                                    >
                                        进行中的课程
                                    </h3>
                                    <button
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--md-primary)' }}
                                    >
                                        查看全部
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {courses.map(course => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 右侧：日历和任务 */}
                        <div className="space-y-6">
                            {/* 日历 */}
                            <div
                                className="p-4 shape-xl elevation-1"
                                style={{ backgroundColor: 'var(--md-surface-container-low)' }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3
                                        className="font-medium"
                                        style={{ color: 'var(--md-on-surface)' }}
                                    >
                                        {calendarDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                                    </h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={prevMonth}
                                            className="w-8 h-8 shape-full flex items-center justify-center state-layer"
                                            style={{ color: 'var(--md-on-surface-variant)' }}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={nextMonth}
                                            className="w-8 h-8 shape-full flex items-center justify-center state-layer"
                                            style={{ color: 'var(--md-on-surface-variant)' }}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 星期标题 */}
                                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                                    {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                                        <span key={d} style={{ color: 'var(--md-on-surface-variant)' }}>{d}</span>
                                    ))}
                                </div>

                                {/* 日期格子 */}
                                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                    {getCalendarDays().slice(0, 35).map((day, i) => {
                                        const dateStr = formatDate(day.date);
                                        const isToday = dateStr === today;
                                        const isSelected = dateStr === formatDate(selectedDate);

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedDate(day.date)}
                                                className="w-8 h-8 shape-full flex items-center justify-center text-xs transition-all"
                                                style={{
                                                    backgroundColor: isToday
                                                        ? 'var(--md-primary)'
                                                        : isSelected
                                                            ? 'var(--md-secondary-container)'
                                                            : 'transparent',
                                                    color: isToday
                                                        ? 'var(--md-on-primary)'
                                                        : isSelected
                                                            ? 'var(--md-on-secondary-container)'
                                                            : !day.isCurrentMonth
                                                                ? 'var(--md-outline)'
                                                                : 'var(--md-on-surface)',
                                                }}
                                            >
                                                {day.date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 今日任务 */}
                            <div
                                className="p-4 shape-xl elevation-1"
                                style={{ backgroundColor: 'var(--md-surface-container-low)' }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3
                                        className="font-medium flex items-center gap-2"
                                        style={{ color: 'var(--md-on-surface)' }}
                                    >
                                        <Calendar className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
                                        今日任务
                                    </h3>
                                    <button
                                        className="w-8 h-8 shape-full flex items-center justify-center"
                                        style={{
                                            backgroundColor: 'var(--md-primary-container)',
                                            color: 'var(--md-on-primary-container)',
                                        }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {tasks.map(task => (
                                        <TaskItem key={task.id} task={task} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// 统计卡片组件
function StatCard({
    icon,
    label,
    value,
    color
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: 'primary' | 'secondary' | 'tertiary';
}) {
    const colors = {
        primary: {
            bg: 'var(--md-primary-container)',
            text: 'var(--md-on-primary-container)',
        },
        secondary: {
            bg: 'var(--md-secondary-container)',
            text: 'var(--md-on-secondary-container)',
        },
        tertiary: {
            bg: 'var(--md-tertiary-container)',
            text: 'var(--md-on-tertiary-container)',
        },
    };

    return (
        <div
            className="p-4 shape-lg elevation-1"
            style={{ backgroundColor: 'var(--md-surface-container-low)' }}
        >
            <div
                className="w-10 h-10 shape-md flex items-center justify-center mb-3"
                style={{
                    backgroundColor: colors[color].bg,
                    color: colors[color].text,
                }}
            >
                {icon}
            </div>
            <p
                className="text-2xl font-medium"
                style={{ color: 'var(--md-on-surface)' }}
            >
                {value}
            </p>
            <p
                className="text-sm"
                style={{ color: 'var(--md-on-surface-variant)' }}
            >
                {label}
            </p>
        </div>
    );
}

// 课程卡片组件
function CourseCard({ course }: { course: Course }) {
    return (
        <div
            className="p-4 shape-lg elevation-1 state-layer cursor-pointer"
            style={{ backgroundColor: 'var(--md-surface-container-low)' }}
        >
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-10 h-10 shape-md flex items-center justify-center text-lg"
                    style={{
                        backgroundColor: course.color + '20',
                        color: course.color,
                    }}
                >
                    {course.icon}
                </div>
                <span
                    className="text-xs font-medium px-2 py-1 shape-full"
                    style={{
                        backgroundColor: 'var(--md-surface-container-highest)',
                        color: 'var(--md-on-surface-variant)',
                    }}
                >
                    {course.progress}%
                </span>
            </div>

            <h4
                className="font-medium mb-1"
                style={{ color: 'var(--md-on-surface)' }}
            >
                {course.title}
            </h4>
            <p
                className="text-sm mb-4"
                style={{ color: 'var(--md-on-surface-variant)' }}
            >
                {course.chapter}
            </p>

            {/* 进度条 */}
            <div
                className="h-1 shape-full overflow-hidden mb-4"
                style={{ backgroundColor: 'var(--md-surface-container-highest)' }}
            >
                <div
                    className="h-full transition-all"
                    style={{
                        width: `${course.progress}%`,
                        backgroundColor: course.color,
                    }}
                />
            </div>

            <button
                className="w-full py-2.5 shape-full text-sm font-medium flex items-center justify-center gap-2 state-layer"
                style={{
                    backgroundColor: 'var(--md-primary)',
                    color: 'var(--md-on-primary)',
                }}
            >
                继续学习
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// 任务项组件
function TaskItem({ task }: { task: Task }) {
    return (
        <div
            className="flex items-center gap-3 p-3 shape-md transition-all state-layer"
            style={{
                backgroundColor: task.completed
                    ? 'var(--md-surface-container-highest)'
                    : 'transparent',
                opacity: task.completed ? 0.6 : 1,
            }}
        >
            <div
                className="w-3 h-3 shape-full"
                style={{ backgroundColor: task.color }}
            />
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-medium truncate"
                    style={{
                        color: 'var(--md-on-surface)',
                        textDecoration: task.completed ? 'line-through' : 'none',
                    }}
                >
                    {task.title}
                </p>
                <p
                    className="text-xs"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                >
                    {task.time} · {task.duration}分钟
                </p>
            </div>
            {task.completed && (
                <span
                    className="text-xs px-2 py-0.5 shape-full"
                    style={{
                        backgroundColor: 'var(--md-secondary-container)',
                        color: 'var(--md-on-secondary-container)',
                    }}
                >
                    已完成
                </span>
            )}
        </div>
    );
}
