/**
 * 认证上下文 - 管理用户登录状态
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import * as authService from '@/services/auth';
import { getToken, getRefreshToken, saveToken, saveRefreshToken, clearTokens, refreshAccessToken } from '@/services/api';

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
            const refreshToken = getRefreshToken();
            
            if (!refreshToken) {
                setIsLoading(false);
                return;
            }

            try {
                // 如果有 refresh_token，尝试刷新
                if (refreshToken) {
                    const refreshed = await refreshAccessToken();
                    if (refreshed) {
                        const currentUser = await authService.getCurrentUser();
                        setUser(currentUser);
                    } else {
                        // 刷新失败，清除令牌
                        clearTokens();
                    }
                } else if (token) {
                    // 没有 refresh_token，但有 access_token，尝试获取用户信息
                    const currentUser = await authService.getCurrentUser();
                    setUser(currentUser);
                }
            } catch (error) {
                console.error('恢复会话失败:', error);
                clearTokens();
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await authService.login({ username, password });
        // 保存令牌
        if (response.access_token) {
            saveToken(response.access_token);
        }
        if (response.refresh_token) {
            saveRefreshToken(response.refresh_token);
        }
        setUser(response.user);
    };

    const register = async (username: string, password: string, name: string, grade?: string) => {
        const response = await authService.register({ username, password, name, grade });
        // 保存令牌
        if (response.access_token) {
            saveToken(response.access_token);
        }
        if (response.refresh_token) {
            saveRefreshToken(response.refresh_token);
        }
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
