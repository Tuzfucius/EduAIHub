/**
 * Settings Service - 用户设置管理
 * 从第一版 EduAIHub 完整迁移，支持多 API 配置管理
 */

// API 配置接口
export interface ApiConfig {
    id: string;
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    format: 'openai' | 'anthropic' | 'custom';
    isActive: boolean;
    createdAt: number;
}

// 用户设置接口
export interface UserSettings {
    // 账户信息
    displayName: string;
    grade: string;

    // 激活的 LLM API ID
    activeLlmApiId: string;

    // 引导模式
    scaffoldingMode: 'rush' | 'balanced' | 'socratic';

    // AI 人格
    persona: 'senior' | 'professor' | 'friend';

    // 提示词模式: 'composed' 使用组合模式, 'custom' 使用自定义提示词
    promptMode: 'composed' | 'custom';

    // 激活的自定义提示词 ID
    activePromptId: string;

    // 自定义提示词片段（组合模式下追加到系统提示词）
    customPromptSnippet: string;
}

// 默认设置
const DEFAULT_SETTINGS: UserSettings = {
    displayName: '',
    grade: '',
    activeLlmApiId: '',
    scaffoldingMode: 'balanced',
    persona: 'senior',
    promptMode: 'composed',
    activePromptId: '',
    customPromptSnippet: '',
};

// 当前用户 ID（用于隔离存储）
let currentUserId: string | null = null;

/**
 * 设置当前用户
 */
export function setCurrentUser(userId: string | null): void {
    currentUserId = userId;
}

/**
 * 获取当前用户 ID
 */
export function getCurrentUserId(): string | null {
    return currentUserId;
}

/**
 * 获取存储 key
 */
function getStorageKey(): string {
    return currentUserId
        ? `eduaihub_settings_${currentUserId}`
        : 'eduaihub_settings_guest';
}

/**
 * 获取 LLM APIs 存储 key
 */
function getLlmApisKey(): string {
    return currentUserId
        ? `eduaihub_llm_apis_${currentUserId}`
        : 'eduaihub_llm_apis_guest';
}

/**
 * 获取用户设置
 */
export function getSettings(): UserSettings {
    try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
        return { ...DEFAULT_SETTINGS };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

/**
 * 保存用户设置
 */
export function saveSettings(settings: Partial<UserSettings>): UserSettings {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
    return updated;
}

/**
 * 更新单个设置项
 */
export function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
): UserSettings {
    return saveSettings({ [key]: value });
}

/**
 * 重置设置
 */
export function resetSettings(): UserSettings {
    localStorage.removeItem(getStorageKey());
    return { ...DEFAULT_SETTINGS };
}

// ============ LLM API 管理 ============

/**
 * 获取所有 LLM APIs
 */
export function getLlmApis(): ApiConfig[] {
    try {
        const stored = localStorage.getItem(getLlmApisKey());
        if (stored) {
            return JSON.parse(stored);
        }
        return [];
    } catch {
        return [];
    }
}

/**
 * 保存 LLM API
 */
export function saveLlmApi(api: Omit<ApiConfig, 'id' | 'createdAt'>): ApiConfig {
    const apis = getLlmApis();
    const newApi: ApiConfig = {
        ...api,
        id: `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
    };
    apis.push(newApi);
    localStorage.setItem(getLlmApisKey(), JSON.stringify(apis));

    // 如果是第一个 API 或标记为激活，设置为激活
    if (apis.length === 1 || api.isActive) {
        setActiveLlmApi(newApi.id);
    }

    return newApi;
}

/**
 * 更新 LLM API
 */
export function updateLlmApi(id: string, updates: Partial<ApiConfig>): ApiConfig | null {
    const apis = getLlmApis();
    const index = apis.findIndex(a => a.id === id);
    if (index === -1) return null;

    apis[index] = { ...apis[index], ...updates };
    localStorage.setItem(getLlmApisKey(), JSON.stringify(apis));
    return apis[index];
}

/**
 * 删除 LLM API
 */
export function deleteLlmApi(id: string): boolean {
    const apis = getLlmApis();
    const filtered = apis.filter(a => a.id !== id);
    if (filtered.length === apis.length) return false;

    localStorage.setItem(getLlmApisKey(), JSON.stringify(filtered));

    // 如果删除的是激活的 API，清除激活状态
    const settings = getSettings();
    if (settings.activeLlmApiId === id) {
        saveSettings({ activeLlmApiId: filtered[0]?.id || '' });
    }

    return true;
}

/**
 * 设置激活的 LLM API
 */
export function setActiveLlmApi(id: string): void {
    saveSettings({ activeLlmApiId: id });
}

/**
 * 获取激活的 LLM API
 */
export function getActiveLlmApi(): ApiConfig | null {
    const settings = getSettings();
    const apis = getLlmApis();
    return apis.find(a => a.id === settings.activeLlmApiId) || apis[0] || null;
}

// ============ 工具函数 ============

/**
 * 检查是否已配置 API
 */
export function isApiConfigured(): boolean {
    return getActiveLlmApi() !== null;
}

/**
 * 获取引导模式显示名称
 */
export function getScaffoldingModeLabel(mode: UserSettings['scaffoldingMode']): string {
    const labels: Record<UserSettings['scaffoldingMode'], string> = {
        rush: '直接模式 (Rush)',
        balanced: '平衡模式 (Balanced)',
        socratic: '苏格拉底模式 (Socratic)',
    };
    return labels[mode];
}

/**
 * 获取人格显示名称
 */
export function getPersonaLabel(persona: UserSettings['persona']): string {
    const labels: Record<UserSettings['persona'], string> = {
        senior: '学长/学姐',
        professor: '教授',
        friend: '朋友',
    };
    return labels[persona];
}
