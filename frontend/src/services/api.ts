/**
 * HTTP 请求封装
 */
import { config } from '@/config';

const API_BASE_URL = config.apiBaseUrl;

/**
 * 获取存储的 Access Token
 */
export function getToken(): string | null {
    return localStorage.getItem('access_token');
}

/**
 * 保存 Access Token
 */
export function saveToken(token: string): void {
    localStorage.setItem('access_token', token);
}

/**
 * 清除所有 Token
 */
export function clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

/**
 * 获取 Refresh Token
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
}

/**
 * 保存 Refresh Token
 */
export function saveRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
    return !!getToken() || !!getRefreshToken();
}

/**
 * 自动刷新 Token
 */
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }

    // 如果已经在刷新中，等待刷新完成
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                clearTokens();
                return false;
            }

            const data = await response.json();
            if (data.access_token) {
                saveToken(data.access_token);
                saveRefreshToken(data.refresh_token);
                return true;
            }
            return false;
        } catch {
            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * 通用请求函数（带自动刷新）
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

    let response = await fetch(url, {
        ...options,
        headers,
    });

    // 如果 401 且有 refresh_token，尝试刷新
    if (response.status === 401 && getRefreshToken()) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // 重新获取 token 并发送请求
            const newToken = getToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
            }
            response = await fetch(url, {
                ...options,
                headers,
            });
        }
    }

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
