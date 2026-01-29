/**
 * HTTP 请求封装
 */
import { config } from '@/config';

const API_BASE_URL = config.apiBaseUrl;

/**
 * 获取存储的 JWT Token
 */
export function getToken(): string | null {
    return localStorage.getItem('access_token');
}

/**
 * 保存 JWT Token
 */
export function saveToken(token: string): void {
    localStorage.setItem('access_token', token);
}

/**
 * 清除 JWT Token
 */
export function clearToken(): void {
    localStorage.removeItem('access_token');
}

/**
 * 通用请求函数
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 自动附加 JWT Token
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '请求失败' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * GET 请求
 */
export async function get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
}

/**
 * POST 请求
 */
export async function post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * PUT 请求
 */
export async function put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * DELETE 请求
 */
export async function del<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
}
