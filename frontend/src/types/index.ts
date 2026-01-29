/**
 * TypeScript 类型定义
 */

export interface User {
    id: number;
    username: string;
    name: string;
    grade?: string;
    email?: string;
    avatar_url?: string;
    role: string;
    theme: string;
    language: string;
    created_at: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    name: string;
    grade?: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    user: User;
}
