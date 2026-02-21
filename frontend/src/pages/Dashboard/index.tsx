/**
 * Dashboard 仪表盘 - Material Design 3 风格
 * 集成日程管理功能
 */
import React, { useState, useEffect } from 'react';
import {
    BookOpen, Target, Clock,
    ChevronRight, ChevronLeft, Plus, Calendar,
    TrendingUp, Sparkles, Check, X, Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, THEME_COLORS } from '@/contexts/ThemeContext';
import * as taskService from '@/services/taskService';

interface Course {
    id: string;
    title: string;
    chapter: string;
    progress: number;
    icon: string;
    color: string;
}

const mockCourses: Course[] = [
    { id: '1', title: '高等数学', chapter: '第5章 偏微分方程', progress: 85, icon: '∑', color: '#6750A4' },
    { id: '2', title: '数据结构', chapter: '第3章 二叉树与堆', progress: 42, icon: '{}', color: '#7D5260' },
    { id: '3', title: '线性代数', chapter: '第4章 特征值与特征向量', progress: 68, icon: '⊕', color: '#625B71' },
];

export default function Dashboard() {
    const { user } = useAuth();
    const { isDark, colorTheme } = useTheme();
    const themeColor = THEME_COLORS.find(c => c.id === colorTheme) || THEME_COLORS[0];
    const [currentDate] = useState(new Date());
    const [courses] = useState<Course[]>(mockCourses);

    const [tasks, setTasks] = useState<taskService.FocusTask[]>([]);
    const [currentTask, setCurrentTask] = useState<taskService.FocusTask | null>(null);

    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDateTasks, setSelectedDateTasks] = useState<taskService.FocusTask[]>([]);

    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('09:00');
    const [newTaskDuration, setNewTaskDuration] = useState('60');

    useEffect(() => {
        if (user?.id) {
            taskService.setCurrentUser(user.id.toString());
        }
        taskService.initDemoTasks();
        refreshTasks();
    }, [user]);

    useEffect(() => {
        const dateStr = taskService.formatDate(selectedDate);
        setSelectedDateTasks(taskService.getTasksForDate(dateStr));
    }, [selectedDate, tasks]);

    const refreshTasks = () => {
        const todayTasks = taskService.getTodaysTasks();
        setTasks(todayTasks);
        setCurrentTask(taskService.getCurrentTask());
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const dateStr = taskService.formatDate(selectedDate);
        taskService.addTask({
            title: newTaskTitle,
            startTime: newTaskTime,
            duration: parseInt(newTaskDuration),
            date: dateStr,
            color: taskService.TASK_COLORS[Math.floor(Math.random() * taskService.TASK_COLORS.length)],
        });

        setNewTaskTitle('');
        setShowAddTask(false);
        refreshTasks();
    };

    const handleCompleteTask = (taskId: string) => {
        taskService.completeTask(taskId);
        refreshTasks();
    };

    const handleDeleteTask = (taskId: string) => {
        taskService.deleteTask(taskId);
        refreshTasks();
    };

    const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    const calendarDays = taskService.getCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth());
    const today = taskService.formatDate(new Date());

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;

    return (
        <div className="min-h-full p-4 md:p-6 theme-transition" style={{ backgroundColor: 'var(--md-surface)' }}>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 animate-fade-in">
                    <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-slate-800 dark:text-white">
                        欢迎回来，{user?.name || '用户'}！
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        {currentDate.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={<BookOpen className="w-5 h-5" />}
                        label="进行中课程"
                        value={courses.length.toString()}
                        colorTheme={themeColor}
                    />
                    <StatCard
                        icon={<Target className="w-5 h-5" />}
                        label="今日任务"
                        value={`${completedTasks}/${totalTasks}`}
                        colorTheme={themeColor}
                    />
                    <StatCard
                        icon={<TrendingUp className="w-5 h-5" />}
                        label="本周学习"
                        value="12.5h"
                        colorTheme={themeColor}
                    />
                    <StatCard
                        icon={<Sparkles className="w-5 h-5" />}
                        label="连续天数"
                        value="7"
                        colorTheme={themeColor}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <div
                            className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
                            style={{
                                background: `linear-gradient(135deg, ${themeColor.primary} 0%, ${themeColor.dark} 100%)`
                            }}
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Target className="w-32 h-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-white/90">
                                        <Target className="w-5 h-5" />
                                        <span className="font-medium">今日专注</span>
                                    </div>
                                </div>

                                {currentTask && !currentTask.completed ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-semibold mb-3">{currentTask.title}</h3>
                                            <div className="flex items-center gap-4 text-white/80 text-sm">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {currentTask.startTime}
                                                </span>
                                                <span>{currentTask.duration} 分钟</span>
                                                <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                                                    {taskService.formatRemainingTime(currentTask)}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCompleteTask(currentTask.id)}
                                            className="w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-lg hover-lift transition-all"
                                            style={{ color: themeColor.primary }}
                                        >
                                            <Check className="w-6 h-6" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-white/80 mb-4 text-lg">当前没有进行中的任务</p>
                                        <button
                                            onClick={() => setShowAddTask(true)}
                                            className="px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 mx-auto bg-white/20 hover:bg-white/30 transition-all hover-lift"
                                        >
                                            <Plus className="w-4 h-4" />
                                            添加任务
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                    进行中的课程
                                </h3>
                                <button
                                    className="text-sm font-medium hover:underline"
                                    style={{ color: themeColor.primary }}
                                >
                                    查看全部
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {courses.map((course, index) => (
                                    <div key={course.id} className="animate-fade-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <CourseCard course={course} themeColor={themeColor} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`
                            p-5 rounded-2xl shadow-sm
                            ${isDark ? 'glass-dark-theme' : 'glass'}
                        `}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-800 dark:text-white">
                                    {calendarDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                                </h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={prevMonth}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        style={{ color: 'var(--md-on-surface-variant)' }}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={nextMonth}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        style={{ color: 'var(--md-on-surface-variant)' }}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                                {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                                    <span key={d} className="text-slate-400">{d}</span>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                {calendarDays.slice(0, 35).map((day, i) => {
                                    const dateStr = taskService.formatDate(day.date);
                                    const isToday = dateStr === today;
                                    const isSelected = dateStr === taskService.formatDate(selectedDate);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(day.date)}
                                            className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all duration-200
                                                ${isToday ? 'text-white' : ''}
                                                ${!day.isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : ''}
                                            `}
                                            style={{
                                                backgroundColor: isToday
                                                    ? themeColor.primary
                                                    : isSelected
                                                        ? `${themeColor.primary}20`
                                                        : 'transparent',
                                                color: isToday
                                                    ? 'white'
                                                    : isSelected
                                                        ? themeColor.primary
                                                        : 'inherit',
                                            }}
                                        >
                                            {day.date.getDate()}
                                            {day.hasEvents && !isToday && (
                                                <span
                                                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                                    style={{ backgroundColor: themeColor.primary }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={`
                            p-5 rounded-2xl shadow-sm
                            ${isDark ? 'glass-dark-theme' : 'glass'}
                        `}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
                                    <Calendar className="w-4 h-4" style={{ color: themeColor.primary }} />
                                    {selectedDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} 日程
                                </h3>
                                <button
                                    onClick={() => setShowAddTask(true)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm hover-lift transition-all"
                                    style={{
                                        backgroundColor: themeColor.primary,
                                        color: 'white',
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {showAddTask && (
                                <form onSubmit={handleAddTask} className="mb-4 p-4 rounded-xl space-y-3 animate-scale-in">
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="任务名称"
                                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                                            color: 'var(--md-on-surface)',
                                            border: '1px solid var(--md-outline-variant)',
                                        }}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={newTaskTime}
                                            onChange={(e) => setNewTaskTime(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                                                color: 'var(--md-on-surface)',
                                                border: '1px solid var(--md-outline-variant)',
                                            }}
                                        />
                                        <select
                                            value={newTaskDuration}
                                            onChange={(e) => setNewTaskDuration(e.target.value)}
                                            className="w-24 px-2 py-2 rounded-lg text-sm outline-none"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                                                color: 'var(--md-on-surface)',
                                                border: '1px solid var(--md-outline-variant)',
                                            }}
                                        >
                                            <option value="15">15分</option>
                                            <option value="30">30分</option>
                                            <option value="45">45分</option>
                                            <option value="60">1小时</option>
                                            <option value="90">1.5时</option>
                                            <option value="120">2小时</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover-lift"
                                            style={{
                                                backgroundColor: themeColor.primary,
                                                color: 'white',
                                            }}
                                        >
                                            添加
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddTask(false)}
                                            className="px-4 py-2 rounded-lg text-sm transition-all"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                                color: 'var(--md-on-surface)',
                                            }}
                                        >
                                            取消
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                                {selectedDateTasks.length > 0 ? (
                                    selectedDateTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onComplete={handleCompleteTask}
                                            onDelete={handleDeleteTask}
                                            colorTheme={themeColor}
                                            isDark={isDark}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-center py-4 text-slate-500 dark:text-slate-400">
                                        暂无日程
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    colorTheme
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    colorTheme: { primary: string; light: string; dark: string };
}) {
    return (
        <div className={`
            p-4 rounded-xl shadow-sm hover-lift transition-all duration-300 cursor-pointer
            ${document.documentElement.classList.contains('dark') ? 'glass-dark-theme' : 'glass'}
        `}>
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                    backgroundColor: `${colorTheme.primary}15`,
                    color: colorTheme.primary,
                }}
            >
                {icon}
            </div>
            <p className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
    );
}

function CourseCard({ course, themeColor }: { course: Course; themeColor: { primary: string; light: string; dark: string } }) {
    return (
        <div className={`
            p-4 rounded-xl shadow-sm hover-lift transition-all duration-300 cursor-pointer card
            ${document.documentElement.classList.contains('dark') ? 'glass-dark-theme' : 'bg-white/60'}
        `}>
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{
                        backgroundColor: course.color + '20',
                        color: course.color,
                    }}
                >
                    {course.icon}
                </div>
                <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                        backgroundColor: document.documentElement.classList.contains('dark')
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.05)',
                        color: 'var(--md-on-surface-variant)',
                    }}
                >
                    {course.progress}%
                </span>
            </div>

            <h4 className="font-medium mb-1 text-slate-800 dark:text-white">{course.title}</h4>
            <p className="text-sm mb-4 text-slate-500 dark:text-slate-400">{course.chapter}</p>

            <div
                className="h-1 rounded-full overflow-hidden mb-4"
                style={{ backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}
            >
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${course.progress}%`,
                        backgroundColor: course.color,
                    }}
                />
            </div>

            <button
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover-lift"
                style={{
                    backgroundColor: themeColor.primary,
                    color: 'white',
                }}
            >
                继续学习
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

function TaskItem({
    task,
    onComplete,
    onDelete,
    colorTheme,
    isDark
}: {
    task: taskService.FocusTask;
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
    colorTheme: { primary: string; light: string; dark: string };
    isDark: boolean;
}) {
    return (
        <div
            className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group
                ${task.completed ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
            `}
            style={{
                opacity: task.completed ? 0.6 : 1,
            }}
        >
            <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: task.color }}
            />
            <div className="flex-1 min-w-0">
                <p
                    className="text-sm font-medium truncate text-slate-800 dark:text-white"
                    style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
                >
                    {task.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {task.startTime} · {task.duration}分钟
                </p>
            </div>

            {!task.completed ? (
                <button
                    onClick={() => onComplete(task.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    style={{
                        backgroundColor: `${colorTheme.primary}15`,
                        color: colorTheme.primary,
                    }}
                >
                    <Check className="w-4 h-4" />
                </button>
            ) : (
                <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                        backgroundColor: `${colorTheme.primary}15`,
                        color: colorTheme.primary,
                    }}
                >
                    已完成
                </span>
            )}

            <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 text-slate-400 hover:text-red-500"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
