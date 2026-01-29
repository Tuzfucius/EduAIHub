/**
 * 认证服务
 */
import { post, get, saveToken, clearToken } from './api';
import type { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types';

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await post<TokenResponse>('/api/auth/register', data);
    saveToken(response.access_token);
    return response;
}

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<TokenResponse> {
    const response = await post<TokenResponse>('/api/auth/login', data);
    saveToken(response.access_token);
    return response;
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<User> {
    return get<User>('/api/auth/me');
}

/**
 * 登出
 */
export function logout(): void {
    clearToken();
}
