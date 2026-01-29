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
import { useTheme } from '@/contexts/ThemeContext';
import * as taskService from '@/services/taskService';

// 模拟课程数据
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
    const { getGradientStyle } = useTheme();
    const [currentDate] = useState(new Date());
    const [courses] = useState<Course[]>(mockCourses);

    // 任务管理状态
    const [tasks, setTasks] = useState<taskService.FocusTask[]>([]);
    const [currentTask, setCurrentTask] = useState<taskService.FocusTask | null>(null);

    // 日历状态
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDateTasks, setSelectedDateTasks] = useState<taskService.FocusTask[]>([]);

    // 添加任务表单
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('09:00');
    const [newTaskDuration, setNewTaskDuration] = useState('60');

    // 初始化
    useEffect(() => {
        if (user?.id) {
            taskService.setCurrentUser(user.id.toString());
        }
        taskService.initDemoTasks();
        refreshTasks();
    }, [user]);

    // 更新选中日期的任务
    useEffect(() => {
        const dateStr = taskService.formatDate(selectedDate);
        setSelectedDateTasks(taskService.getTasksForDate(dateStr));
    }, [selectedDate, tasks]);

    const refreshTasks = () => {
        const todayTasks = taskService.getTodaysTasks();
        setTasks(todayTasks);
        setCurrentTask(taskService.getCurrentTask());
    };

    // 添加任务
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

    // 完成任务
    const handleCompleteTask = (taskId: string) => {
        taskService.completeTask(taskId);
        refreshTasks();
    };

    // 删除任务
    const handleDeleteTask = (taskId: string) => {
        taskService.deleteTask(taskId);
        refreshTasks();
    };

    // 日历导航
    const prevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    const calendarDays = taskService.getCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth());
    const today = taskService.formatDate(new Date());

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;

    return (
        <div className="min-h-full p-4 md:p-6">
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
                            className="p-6 shape-xl text-white"
                            style={getGradientStyle()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-white/90">
                                    <Target className="w-5 h-5" />
                                    <span className="font-medium">今日专注</span>
                                </div>
                            </div>

                            {currentTask && !currentTask.completed ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-medium mb-2">
                                            {currentTask.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-white/80 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {currentTask.startTime}
                                            </span>
                                            <span>{currentTask.duration} 分钟</span>
                                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                                {taskService.formatRemainingTime(currentTask)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCompleteTask(currentTask.id)}
                                        className="w-14 h-14 shape-lg flex items-center justify-center elevation-2 bg-white"
                                        style={{ color: 'var(--md-primary)' }}
                                    >
                                        <Check className="w-6 h-6" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-white/80 mb-3">🎉 当前没有进行中的任务</p>
                                    <button
                                        onClick={() => setShowAddTask(true)}
                                        className="px-6 py-2 shape-full text-sm font-medium flex items-center gap-2 mx-auto bg-white/20 hover:bg-white/30"
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
                                {calendarDays.slice(0, 35).map((day, i) => {
                                    const dateStr = taskService.formatDate(day.date);
                                    const isToday = dateStr === today;
                                    const isSelected = dateStr === taskService.formatDate(selectedDate);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(day.date)}
                                            className="w-8 h-8 shape-full flex items-center justify-center text-xs transition-all relative"
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
                                            {day.hasEvents && !isToday && (
                                                <span
                                                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                                    style={{ backgroundColor: 'var(--md-primary)' }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 任务列表 */}
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
                                    {selectedDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} 日程
                                </h3>
                                <button
                                    onClick={() => setShowAddTask(true)}
                                    className="w-8 h-8 shape-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: 'var(--md-primary-container)',
                                        color: 'var(--md-on-primary-container)',
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* 添加任务表单 */}
                            {showAddTask && (
                                <form
                                    onSubmit={handleAddTask}
                                    className="mb-4 p-4 shape-lg space-y-3"
                                    style={{ backgroundColor: 'var(--md-surface-container-highest)' }}
                                >
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="任务名称"
                                        className="w-full px-3 py-2 shape-sm text-sm"
                                        style={{
                                            backgroundColor: 'var(--md-surface)',
                                            color: 'var(--md-on-surface)',
                                            border: '1px solid var(--md-outline)',
                                        }}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="time"
                                            value={newTaskTime}
                                            onChange={(e) => setNewTaskTime(e.target.value)}
                                            className="flex-1 px-3 py-2 shape-sm text-sm"
                                            style={{
                                                backgroundColor: 'var(--md-surface)',
                                                color: 'var(--md-on-surface)',
                                                border: '1px solid var(--md-outline)',
                                            }}
                                        />
                                        <select
                                            value={newTaskDuration}
                                            onChange={(e) => setNewTaskDuration(e.target.value)}
                                            className="w-24 px-2 py-2 shape-sm text-sm"
                                            style={{
                                                backgroundColor: 'var(--md-surface)',
                                                color: 'var(--md-on-surface)',
                                                border: '1px solid var(--md-outline)',
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
                                            className="flex-1 py-2 shape-full text-sm font-medium"
                                            style={{
                                                backgroundColor: 'var(--md-primary)',
                                                color: 'var(--md-on-primary)',
                                            }}
                                        >
                                            添加
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddTask(false)}
                                            className="px-4 py-2 shape-full text-sm"
                                            style={{
                                                backgroundColor: 'var(--md-surface-container)',
                                                color: 'var(--md-on-surface)',
                                            }}
                                        >
                                            取消
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* 任务列表 */}
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {selectedDateTasks.length > 0 ? (
                                    selectedDateTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onComplete={handleCompleteTask}
                                            onDelete={handleDeleteTask}
                                        />
                                    ))
                                ) : (
                                    <p
                                        className="text-sm text-center py-4"
                                        style={{ color: 'var(--md-on-surface-variant)' }}
                                    >
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
function TaskItem({
    task,
    onComplete,
    onDelete
}: {
    task: taskService.FocusTask;
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div
            className="flex items-center gap-3 p-3 shape-md transition-all group"
            style={{
                backgroundColor: task.completed
                    ? 'var(--md-surface-container-highest)'
                    : 'transparent',
                opacity: task.completed ? 0.6 : 1,
            }}
        >
            <div
                className="w-3 h-3 shape-full shrink-0"
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
                    {task.startTime} · {task.duration}分钟
                </p>
            </div>

            {!task.completed ? (
                <button
                    onClick={() => onComplete(task.id)}
                    className="p-1.5 shape-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                        backgroundColor: 'var(--md-primary-container)',
                        color: 'var(--md-on-primary-container)',
                    }}
                >
                    <Check className="w-4 h-4" />
                </button>
            ) : (
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

            <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 shape-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--md-error)' }}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
