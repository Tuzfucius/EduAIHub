/**
 * 登录/注册页面 - Material Design 3 风格
 */
import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 表单状态
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
            } else {
                if (!name) {
                    setError('请输入姓名');
                    setLoading(false);
                    return;
                }
                await register(username, password, name, grade || undefined);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '操作失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--md-surface)' }}
        >
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 shape-xl mb-6"
                        style={{ backgroundColor: 'var(--md-primary-container)' }}
                    >
                        <GraduationCap
                            className="w-10 h-10"
                            style={{ color: 'var(--md-on-primary-container)' }}
                        />
                    </div>
                    <h1
                        className="text-3xl font-medium"
                        style={{ color: 'var(--md-on-surface)' }}
                    >
                        EduAIHub
                    </h1>
                    <p
                        className="mt-2 text-sm"
                        style={{ color: 'var(--md-on-surface-variant)' }}
                    >
                        AI 驱动的智能学习助手
                    </p>
                </div>

                {/* 表单卡片 */}
                <div
                    className="shape-xl p-8 elevation-2"
                    style={{ backgroundColor: 'var(--md-surface-container-low)' }}
                >
                    {/* 分段按钮 (Segmented Button) */}
                    <div
                        className="flex p-1 shape-full mb-8"
                        style={{ backgroundColor: 'var(--md-surface-container-highest)' }}
                    >
                        <button
                            onClick={() => setIsLogin(true)}
                            className="flex-1 py-2.5 px-4 shape-full text-sm font-medium transition-all"
                            style={{
                                backgroundColor: isLogin ? 'var(--md-secondary-container)' : 'transparent',
                                color: isLogin ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                            }}
                        >
                            登录
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className="flex-1 py-2.5 px-4 shape-full text-sm font-medium transition-all"
                            style={{
                                backgroundColor: !isLogin ? 'var(--md-secondary-container)' : 'transparent',
                                color: !isLogin ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                            }}
                        >
                            注册
                        </button>
                    </div>

                    {/* 表单 */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 用户名输入框 */}
                        <div className="relative">
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                minLength={3}
                                placeholder=" "
                                className="peer w-full px-4 pt-5 pb-2 shape-sm border-2 outline-none transition-colors text-base"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: 'var(--md-outline)',
                                    color: 'var(--md-on-surface)',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--md-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--md-outline)'}
                            />
                            <label
                                htmlFor="username"
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none transition-all
                  peer-focus:top-2.5 peer-focus:text-xs peer-focus:-translate-y-0
                  peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:-translate-y-0"
                                style={{ color: 'var(--md-on-surface-variant)' }}
                            >
                                用户名
                            </label>
                        </div>

                        {/* 密码输入框 */}
                        <div className="relative">
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder=" "
                                className="peer w-full px-4 pt-5 pb-2 shape-sm border-2 outline-none transition-colors text-base"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: 'var(--md-outline)',
                                    color: 'var(--md-on-surface)',
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--md-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--md-outline)'}
                            />
                            <label
                                htmlFor="password"
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none transition-all
                  peer-focus:top-2.5 peer-focus:text-xs peer-focus:-translate-y-0
                  peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:-translate-y-0"
                                style={{ color: 'var(--md-on-surface-variant)' }}
                            >
                                密码
                            </label>
                        </div>

                        {!isLogin && (
                            <>
                                {/* 姓名输入框 */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required={!isLogin}
                                        placeholder=" "
                                        className="peer w-full px-4 pt-5 pb-2 shape-sm border-2 outline-none transition-colors text-base"
                                        style={{
                                            backgroundColor: 'transparent',
                                            borderColor: 'var(--md-outline)',
                                            color: 'var(--md-on-surface)',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--md-primary)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--md-outline)'}
                                    />
                                    <label
                                        htmlFor="name"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none transition-all
                      peer-focus:top-2.5 peer-focus:text-xs peer-focus:-translate-y-0
                      peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:-translate-y-0"
                                        style={{ color: 'var(--md-on-surface-variant)' }}
                                    >
                                        姓名
                                    </label>
                                </div>

                                {/* 年级输入框 */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="grade"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder=" "
                                        className="peer w-full px-4 pt-5 pb-2 shape-sm border-2 outline-none transition-colors text-base"
                                        style={{
                                            backgroundColor: 'transparent',
                                            borderColor: 'var(--md-outline)',
                                            color: 'var(--md-on-surface)',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--md-primary)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--md-outline)'}
                                    />
                                    <label
                                        htmlFor="grade"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none transition-all
                      peer-focus:top-2.5 peer-focus:text-xs peer-focus:-translate-y-0
                      peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:-translate-y-0"
                                        style={{ color: 'var(--md-on-surface-variant)' }}
                                    >
                                        年级（可选）
                                    </label>
                                </div>
                            </>
                        )}

                        {/* 错误提示 */}
                        {error && (
                            <div
                                className="px-4 py-3 shape-sm text-sm"
                                style={{
                                    backgroundColor: 'var(--md-error-container)',
                                    color: 'var(--md-on-error-container)',
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {/* 提交按钮 - Filled Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 shape-full text-sm font-medium transition-all state-layer disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: 'var(--md-primary)',
                                color: 'var(--md-on-primary)',
                            }}
                        >
                            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
