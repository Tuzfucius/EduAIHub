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
import { useTheme } from '@/contexts/ThemeContext';

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
    const { isDark, toggleTheme, getGradientStyle } = useTheme();

    const handleNavigate = (page: PageType) => {
        onNavigate(page);
        // Close on mobile
        if (window.innerWidth < 1024) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 lg:hidden"
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full w-72 z-30 transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
                style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
                {/* Header */}
                <div className="p-6 flex items-center gap-3">
                    <div
                        className="w-10 h-10 shape-md flex items-center justify-center"
                        style={getGradientStyle()}
                    >
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span
                        className="font-bold text-xl"
                        style={{ color: 'var(--md-on-surface)' }}
                    >
                        EduAIHub
                    </span>

                    {/* Mobile close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden ml-auto p-2 shape-full"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = currentPage === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 shape-lg transition-all state-layer"
                                style={{
                                    backgroundColor: isActive ? 'var(--md-secondary-container)' : 'transparent',
                                    color: isActive ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                                }}
                            >
                                <Icon className="w-5 h-5" />
                                <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div
                    className="p-4 space-y-4"
                    style={{ borderTop: '1px solid var(--md-outline-variant)' }}
                >
                    {/* Theme toggle */}
                    <div
                        className="flex items-center justify-between px-3 py-2 shape-lg"
                        style={{ backgroundColor: 'var(--md-surface-container-high)' }}
                    >
                        <span
                            className="text-sm"
                            style={{ color: 'var(--md-on-surface-variant)' }}
                        >
                            {isDark ? '深色模式' : '浅色模式'}
                        </span>
                        <button
                            onClick={toggleTheme}
                            className="p-2 shape-full state-layer"
                            style={{ color: 'var(--md-on-surface-variant)' }}
                        >
                            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* User profile */}
                    <div
                        className="flex items-center gap-3 p-3 shape-lg"
                        style={{ backgroundColor: 'var(--md-surface-container-high)' }}
                    >
                        <div
                            className="w-10 h-10 shape-full flex items-center justify-center text-sm font-medium"
                            style={getGradientStyle()}
                        >
                            <span className="text-white">{user?.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--md-on-surface)' }}
                            >
                                {user?.name}
                            </p>
                            <p
                                className="text-xs truncate"
                                style={{ color: 'var(--md-on-surface-variant)' }}
                            >
                                {user?.grade || user?.role || '学生'}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 shape-full state-layer"
                            style={{ color: 'var(--md-error)' }}
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

// Mobile menu button component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden p-2 shape-full state-layer"
            style={{ color: 'var(--md-on-surface-variant)' }}
        >
            <Menu className="w-6 h-6" />
        </button>
    );
}
