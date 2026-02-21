import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Sparkles, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 selection:bg-purple-500/30">

            {/* Neo-brutalism + Glassmorphism Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-pulse duration-10000" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/20 blur-[130px] mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-2xl border border-white/20 dark:border-slate-700/50">

                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 text-white shadow-xl mb-6 relative group"
                        >
                            <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                            <div className="absolute inset-0 rounded-2xl ring-4 ring-purple-500/30 scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                            EduAIHub 3.0
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            重塑您的沉浸式学习体验
                        </p>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                        {isLogin ? (
                            <LoginForm key="login" onToggle={() => setIsLogin(false)} />
                        ) : (
                            <RegisterForm key="register" onToggle={() => setIsLogin(true)} />
                        )}
                    </AnimatePresence>

                </div>
            </motion.div>
        </div>
    );
}

function LoginForm({ onToggle }: { onToggle: () => void }) {
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            params.append('username', formData.username);
            params.append('password', formData.password);

            const res = await api.post('/auth/login', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            login(res.data.access_token, {
                id: 1, // Will be fetched via /me eventually if needed
                username: formData.username
            });
            // Redirect handled by Auth boundaries in App.tsx
        } catch (err: any) {
            setError(err.response?.data?.detail || '登录失败，请检查凭证');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        required
                        placeholder="账号用户名"
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                    />
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                        <Lock className="w-5 h-5" />
                    </div>
                    <input
                        type="password"
                        required
                        placeholder="密码"
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
            </div>

            {error && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg text-center">
                    {error}
                </motion.p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                开启学习之旅
            </button>

            <div className="text-center mt-6">
                <button type="button" onClick={onToggle} className="text-sm font-semibold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    还没有账号？立即创建 <span className="ml-1">→</span>
                </button>
            </div>
        </motion.form>
    );
}

function RegisterForm({ onToggle }: { onToggle: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', formData);
            setSuccess(true);
            setTimeout(() => onToggle(), 1500); // 注册成功后自动切回登录页面
        } catch (err: any) {
            setError(err.response?.data?.detail || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
        >
            {success ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="py-8 text-center text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                    🎉 注册成功，正在转入登录...
                </motion.div>
            ) : (
                <>
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                required
                                placeholder="创建用户名"
                                className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                type="email"
                                placeholder="电子邮箱 (选填)"
                                className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                type="password"
                                required
                                placeholder="设置密码"
                                className="w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-medium"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg text-center">
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-premium w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                        完成注册
                    </button>

                    <div className="text-center mt-6">
                        <button type="button" onClick={onToggle} className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <span className="mr-1">←</span> 返回立即登录
                        </button>
                    </div>
                </>
            )}
        </motion.form>
    );
}
