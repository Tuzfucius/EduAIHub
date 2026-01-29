/**
 * Task Service - 日程任务管理服务
 * 从第一版迁移并适配 TypeScript
 */

export interface FocusTask {
    id: string;
    title: string;
    description?: string;
    startTime: string;      // HH:MM format
    duration: number;       // in minutes
    date: string;           // YYYY-MM-DD format
    completed: boolean;
    completedAt?: string;   // ISO timestamp
    color: string;          // CSS color value
}

// Current user ID for storage isolation
let currentUserId: string | null = null;

/**
 * Set current user for task storage isolation
 */
export function setCurrentUser(userId: string | null): void {
    currentUserId = userId;
}

/**
 * Get storage key for current user
 */
function getStorageKey(): string {
    return currentUserId
        ? `eduaihub2_tasks_${currentUserId}`
        : 'eduaihub2_tasks_guest';
}

/**
 * Generate unique ID
 */
function generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all tasks from localStorage for current user
 */
export function getTasks(): FocusTask[] {
    try {
        const stored = localStorage.getItem(getStorageKey());
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save tasks to localStorage for current user
 */
export function saveTasks(tasks: FocusTask[]): void {
    localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
}

/**
 * Get tasks for a specific date
 */
export function getTasksForDate(date: string): FocusTask[] {
    return getTasks()
        .filter(t => t.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Get today's tasks sorted by start time
 */
export function getTodaysTasks(): FocusTask[] {
    const today = formatDate(new Date());
    return getTasksForDate(today);
}

/**
 * Helper: Convert HH:MM to minutes
 */
export function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Helper: Convert minutes to HH:MM
 */
export function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Get current active task based on time
 */
export function getCurrentTask(): FocusTask | null {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const tasks = getTodaysTasks().filter(t => !t.completed);

    for (const task of tasks) {
        const startMinutes = timeToMinutes(task.startTime);
        const endMinutes = startMinutes + task.duration;
        const nowMinutes = timeToMinutes(currentTime);

        if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
            return task;
        }
    }

    // Return next upcoming task if no current task
    return tasks.find(t => timeToMinutes(t.startTime) > timeToMinutes(currentTime)) || null;
}

/**
 * Add a new task
 */
export function addTask(task: Omit<FocusTask, 'id' | 'completed' | 'completedAt'>): FocusTask {
    const tasks = getTasks();
    const newTask: FocusTask = {
        ...task,
        id: generateId(),
        completed: false,
    };
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
}

/**
 * Update a task
 */
export function updateTask(id: string, updates: Partial<FocusTask>): FocusTask | null {
    const tasks = getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
    return tasks[index];
}

/**
 * Complete a task
 */
export function completeTask(id: string): FocusTask | null {
    return updateTask(id, {
        completed: true,
        completedAt: new Date().toISOString(),
    });
}

/**
 * Delete a task
 */
export function deleteTask(id: string): boolean {
    const tasks = getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    saveTasks(filtered);
    return true;
}

/**
 * Helper: Format remaining time
 */
export function formatRemainingTime(task: FocusTask): string {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const taskEndMinutes = timeToMinutes(task.startTime) + task.duration;
    const remaining = taskEndMinutes - currentMinutes;

    if (remaining <= 0) return '已超时';
    if (remaining < 60) return `剩余 ${remaining} 分钟`;
    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    return `剩余 ${hours} 小时 ${mins} 分钟`;
}

/**
 * Get task colors
 */
export const TASK_COLORS = [
    '#6750A4', // Primary
    '#625B71', // Secondary
    '#7D5260', // Tertiary
    '#0061A4', // Blue
    '#006E1C', // Green
    '#9C4146', // Red
    '#7E5700', // Orange
    '#006874', // Cyan
];

/**
 * Get formatted date string
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Get calendar data for a month
 */
export function getCalendarDays(year: number, month: number): { date: Date; isCurrentMonth: boolean; hasEvents: boolean }[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7; // Monday start

    const days: { date: Date; isCurrentMonth: boolean; hasEvents: boolean }[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        days.push({ date, isCurrentMonth: false, hasEvents: getTasksForDate(formatDate(date)).length > 0 });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        days.push({ date, isCurrentMonth: true, hasEvents: getTasksForDate(formatDate(date)).length > 0 });
    }

    // Next month padding to complete 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i);
        days.push({ date, isCurrentMonth: false, hasEvents: getTasksForDate(formatDate(date)).length > 0 });
    }

    return days;
}

/**
 * Initialize with demo tasks if empty for current user
 */
export function initDemoTasks(): void {
    if (getTasks().length > 0) return;

    const today = formatDate(new Date());
    const demoTasks: Omit<FocusTask, 'id' | 'completed' | 'completedAt'>[] = [
        { title: '高等数学复习', description: '微积分章节', startTime: '09:00', duration: 60, date: today, color: TASK_COLORS[0] },
        { title: '英语听力练习', description: 'TED演讲', startTime: '10:30', duration: 45, date: today, color: TASK_COLORS[1] },
        { title: '数据结构作业', description: '二叉树实现', startTime: '14:00', duration: 90, date: today, color: TASK_COLORS[3] },
        { title: '论文阅读', description: 'Machine Learning', startTime: '16:00', duration: 60, date: today, color: TASK_COLORS[4] },
    ];

    demoTasks.forEach(t => addTask(t));
}
