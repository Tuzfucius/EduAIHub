import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, MessageSquare, Library, LogOut, Sun, Moon, Settings, Database } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function MainLayout() {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: '概览面板' },
        { to: '/solver', icon: MessageSquare, label: '智能解答' },
        { to: '/knowledge', icon: Database, label: '源知识库' },
        { to: '/materials', icon: Library, label: '我的应用' },
        { to: '/settings', icon: Settings, label: '统一设置' }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative selection:bg-purple-500/30">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                className="w-20 md:w-64 fixed h-[calc(100vh-2rem)] top-4 left-4 z-50 glass-panel rounded-[2rem] flex flex-col items-center md:items-stretch py-8 shadow-2xl border-white/50 dark:border-slate-700/50 hidden sm:flex"
            >
                <div className="px-0 md:px-8 mb-12 flex items-center justify-center md:justify-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shadow-lg shrink-0">
                        ✨
                    </div>
                    <span className="font-black text-xl tracking-tight hidden md:block bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                        EduAI
                    </span>
                </div>

                <nav className="flex-1 w-full px-4 space-y-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 overflow-hidden group 
                ${isActive ? 'text-white font-bold bg-gradient-to-r from-purple-500/90 to-blue-500/90 shadow-lg shadow-purple-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-medium'}`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-purple-500'}`} />
                                    <span className="hidden md:block truncate relative z-10">{item.label}</span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto px-4 flex flex-col md:flex-row items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="w-12 h-12 md:flex-1 rounded-2xl flex md:hidden xl:flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-amber-400 group"
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                    </button>
                    <button
                        onClick={logout}
                        className="w-12 h-12 md:flex-1 rounded-2xl flex md:hidden xl:flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors shrink-0"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 sm:pl-28 md:pl-72 w-full min-h-screen relative transition-all duration-300">
                {/* Bottom mobile nav could be added here for < sm screens */}
                <div className="block sm:hidden glass-panel fixed bottom-4 left-4 right-4 h-16 rounded-2xl z-50 flex items-center justify-around">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className={({ isActive }) => `p-3 rounded-xl transition-all ${isActive ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' : 'text-slate-500'}`}>
                            <item.icon className="w-5 h-5" />
                        </NavLink>
                    ))}
                </div>

                {/* Render Child routes */}
                <Outlet />
            </main>
        </div>
    );
}
