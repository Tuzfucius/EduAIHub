// Settings Service - User settings management with localStorage
// Per-user isolated storage with multi-API support

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

export interface UserSettings {
    displayName: string;
    grade: string;
    activeLlmApiId: string;
    activeEmbeddingApiId: string;
    scaffoldingMode: 'rush' | 'balanced' | 'socratic';
    persona: 'senior' | 'professor' | 'friend';
    promptMode: 'composed' | 'custom';
    activePromptId: string;
    customPromptSnippet: string;
    ragEmbedModel: string;
    ragAlpha: number;
    ragTopK: number;
}

const DEFAULT_SETTINGS: UserSettings = {
    displayName: '',
    grade: '',
    activeLlmApiId: '',
    activeEmbeddingApiId: '',
    scaffoldingMode: 'balanced',
    persona: 'senior',
    promptMode: 'composed',
    activePromptId: '',
    customPromptSnippet: '',
    ragEmbedModel: 'BAAI/bge-m3',
    ragAlpha: 0.5,
    ragTopK: 3,
};

let currentUserId: string | null = null;

export function setCurrentUser(userId: string | null): void {
    currentUserId = userId;
}

export function getCurrentUserId(): string | null {
    return currentUserId;
}

function getStorageKey(): string {
    return currentUserId ? `eduaihub_settings_${currentUserId}` : 'eduaihub_settings_guest';
}

function getLlmApisKey(): string {
    return currentUserId ? `eduaihub_llm_apis_${currentUserId}` : 'eduaihub_llm_apis_guest';
}

function getEmbeddingApisKey(): string {
    return currentUserId ? `eduaihub_embedding_apis_${currentUserId}` : 'eduaihub_embedding_apis_guest';
}

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

export function saveSettings(settings: Partial<UserSettings>): UserSettings {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(getStorageKey(), JSON.stringify(updated));
    return updated;
}

export function resetSettings(): UserSettings {
    localStorage.removeItem(getStorageKey());
    return { ...DEFAULT_SETTINGS };
}

// ============ LLM API Management ============

export function getLlmApis(): ApiConfig[] {
    try {
        const stored = localStorage.getItem(getLlmApisKey());
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function saveLlmApi(api: Omit<ApiConfig, 'id' | 'createdAt'>): ApiConfig {
    const apis = getLlmApis();
    const newApi: ApiConfig = {
        ...api,
        id: `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
    };
    apis.push(newApi);
    localStorage.setItem(getLlmApisKey(), JSON.stringify(apis));

    if (apis.length === 1 || api.isActive) {
        setActiveLlmApi(newApi.id);
    }
    return newApi;
}

export function deleteLlmApi(id: string): boolean {
    const apis = getLlmApis();
    const filtered = apis.filter(a => a.id !== id);
    if (filtered.length === apis.length) return false;

    localStorage.setItem(getLlmApisKey(), JSON.stringify(filtered));
    const settings = getSettings();
    if (settings.activeLlmApiId === id) {
        saveSettings({ activeLlmApiId: filtered[0]?.id || '' });
    }
    return true;
}

export function setActiveLlmApi(id: string): void {
    saveSettings({ activeLlmApiId: id });
}

export function getActiveLlmApi(): ApiConfig | null {
    const settings = getSettings();
    const apis = getLlmApis();
    return apis.find(a => a.id === settings.activeLlmApiId) || apis[0] || null;
}

// ============ Embedding API Management ============

export function getEmbeddingApis(): ApiConfig[] {
    try {
        const stored = localStorage.getItem(getEmbeddingApisKey());
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function saveEmbeddingApi(api: Omit<ApiConfig, 'id' | 'createdAt'>): ApiConfig {
    const apis = getEmbeddingApis();
    const newApi: ApiConfig = {
        ...api,
        id: `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
    };
    apis.push(newApi);
    localStorage.setItem(getEmbeddingApisKey(), JSON.stringify(apis));

    if (apis.length === 1 || api.isActive) {
        setActiveEmbeddingApi(newApi.id);
    }
    return newApi;
}

export function deleteEmbeddingApi(id: string): boolean {
    const apis = getEmbeddingApis();
    const filtered = apis.filter(a => a.id !== id);
    if (filtered.length === apis.length) return false;

    localStorage.setItem(getEmbeddingApisKey(), JSON.stringify(filtered));
    const settings = getSettings();
    if (settings.activeEmbeddingApiId === id) {
        saveSettings({ activeEmbeddingApiId: filtered[0]?.id || '' });
    }
    return true;
}

export function setActiveEmbeddingApi(id: string): void {
    saveSettings({ activeEmbeddingApiId: id });
}

export function getActiveEmbeddingApi(): ApiConfig | null {
    const settings = getSettings();
    const apis = getEmbeddingApis();
    return apis.find(a => a.id === settings.activeEmbeddingApiId) || apis[0] || null;
}
