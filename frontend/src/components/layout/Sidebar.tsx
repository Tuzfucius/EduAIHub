/**
 * Sidebar - Material Design 3 侧边栏导航
 */
import React from 'react';
import {
    LayoutDashboard,
    BrainCircuit,
    FolderOpen,
    Settings,
    LogOut,
    Moon,
    Sun,
    GraduationCap,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, THEME_COLORS } from '@/contexts/ThemeContext';

export type PageType = 'dashboard' | 'ai-solver' | 'materials' | 'settings';

interface SidebarProps {
    currentPage: PageType;
    onNavigate: (page: PageType) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const menuItems: { id: PageType; icon: React.ElementType; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘' },
    { id: 'ai-solver', icon: BrainCircuit, label: 'AI 助手' },
    { id: 'materials', icon: FolderOpen, label: '材料分类' },
    { id: 'settings', icon: Settings, label: '设置' },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, setIsOpen }: SidebarProps) {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme, colorTheme } = useTheme();
    const themeColor = THEME_COLORS.find(c => c.id === colorTheme) || THEME_COLORS[0];

    const handleNavigate = (page: PageType) => {
        onNavigate(page);
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 lg:hidden backdrop-blur-sm bg-black/20"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed top-0 left-0 h-full w-72 z-30 transition-transform duration-300 ease-in-out
                    flex flex-col
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${isDark ? 'glass-dark-theme' : 'glass'}
                `}
            >
                <div className="p-6 flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${themeColor.primary} 0%, ${themeColor.dark} 100%)` }}
                    >
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">
                        EduAIHub
                    </span>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden ml-auto p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
                    {menuItems.map((item, index) => {
                        const isActive = currentPage === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                    transition-all duration-200 hover-lift animate-fade-slide-up
                                    ${isActive
                                        ? 'bg-[var(--color-theme-light)] text-[var(--color-theme-dark)] font-semibold'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                    }
                                `}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-theme)]' : ''}`} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700/50">
                    <div className={`
                        flex items-center justify-between px-3 py-2 rounded-xl
                        ${isDark ? 'bg-slate-800/50' : 'bg-slate-100'}
                    `}>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            {isDark ? '深色模式' : '浅色模式'}
                        </span>
                        <button
                            onClick={toggleTheme}
                            className={`
                                p-2 rounded-lg transition-all duration-200
                                ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-600'}
                                hover:scale-105
                            `}
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className={`
                        flex items-center gap-3 p-3 rounded-xl
                        ${isDark ? 'bg-slate-800/50' : 'bg-white/60'}
                        hover-lift cursor-pointer
                    `}>
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-sm"
                            style={{ background: `linear-gradient(135deg, ${themeColor.primary} 0%, ${themeColor.dark} 100%)` }}
                        >
                            <span className="text-white">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {user?.name || '用户'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {user?.grade || user?.role || '学生'}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-105"
                            title="退出登录"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--md-on-surface-variant)' }}
        >
            <Menu className="w-6 h-6" />
        </button>
    );
}
