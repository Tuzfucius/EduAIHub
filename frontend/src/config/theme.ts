/**
 * 主题配置
 * 支持 7 种主题色，可自由切换，平滑过渡
 */

export const THEME_COLORS = [
    { id: 'purple', name: '紫色', primary: '#8B5CF6', light: '#FAF5FF', dark: '#7C3AED' },
    { id: 'indigo', name: '靛蓝', primary: '#6366F1', light: '#EEF2FF', dark: '#4F46E5' },
    { id: 'blue', name: '蓝色', primary: '#3B82F6', light: '#EFF6FF', dark: '#2563EB' },
    { id: 'emerald', name: '祖母绿', primary: '#10B981', light: '#ECFDF5', dark: '#059669' },
    { id: 'orange', name: '橙色', primary: '#F97316', light: '#FFF7ED', dark: '#EA580C' },
    { id: 'rose', name: '玫瑰', primary: '#F43F5E', light: '#FFF1F2', dark: '#E11D48' },
    { id: 'cyan', name: '青色', primary: '#06B6D4', light: '#ECFEFF', dark: '#0891B2' },
] as const;

export type ThemeColor = typeof THEME_COLORS[number]['id'];

export const DEFAULT_COLOR: ThemeColor = 'purple';

export function getColorById(id: ThemeColor) {
    return THEME_COLORS.find(c => c.id === id) || THEME_COLORS[0];
}
