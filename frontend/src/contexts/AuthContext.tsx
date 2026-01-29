/**
 * 认证上下文 - 管理用户登录状态
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import * as authService from '@/services/auth';
import { getToken } from '@/services/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, name: string, grade?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化时尝试恢复登录状态
    useEffect(() => {
        const restoreSession = async () => {
            const token = getToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error('恢复会话失败:', error);
                authService.logout();
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await authService.login({ username, password });
        setUser(response.user);
    };

    const register = async (username: string, password: string, name: string, grade?: string) => {
        const response = await authService.register({ username, password, name, grade });
        setUser(response.user);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth 必须在 AuthProvider 内部使用');
    }
    return context;
}
