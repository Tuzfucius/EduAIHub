/**
 * Settings - 设置页面 (Material Design 3)
 * 支持外观设置、API 配置、提示词管理
 */
import React, { useState, useEffect } from 'react';
import {
    Palette,
    Key,
    MessageSquare,
    ChevronRight,
    Check,
    Plus,
    Trash2,
    Edit2,
    X,
    Save,
    Zap,
    Moon,
    Sun
} from 'lucide-react';
import { useTheme, THEME_COLORS } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import * as settingsService from '@/services/settingsService';
import * as promptService from '@/services/promptService';
import { testApiConnection } from '@/services/aiService';
import { ThemeColor } from '@/config/theme';

type TabId = 'appearance' | 'api' | 'prompt';

const tabs: { id: TabId; icon: React.ElementType; label: string }[] = [
    { id: 'appearance', icon: Palette, label: '外观设置' },
    { id: 'api', icon: Key, label: 'API 配置' },
    { id: 'prompt', icon: MessageSquare, label: '提示词管理' },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState<TabId>('appearance');
    const { isDark, toggleTheme, colorTheme, setColorTheme } = useTheme();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            settingsService.setCurrentUser(user.id.toString());
        }
    }, [user]);

    return (
        <div className="min-h-full p-4 md:p-6 theme-transition" style={{ backgroundColor: 'var(--md-surface)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-slate-800 dark:text-white">
                        设置
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        自定义您的学习体验
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-56 shrink-0">
                        <nav className="space-y-1">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
                                            ${isActive
                                                ? 'bg-[var(--color-theme-light)] text-[var(--color-theme-dark)] font-semibold'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-theme)]' : ''}`} />
                                        <span>{tab.label}</span>
                                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex-1">
                        {activeTab === 'appearance' && (
                            <AppearanceTab
                                isDark={isDark}
                                toggleTheme={toggleTheme}
                                colorTheme={colorTheme}
                                setColorTheme={setColorTheme}
                            />
                        )}
                        {activeTab === 'api' && <ApiTab />}
                        {activeTab === 'prompt' && <PromptTab />}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AppearanceTab({
    isDark,
    toggleTheme,
    colorTheme,
    setColorTheme
}: {
    isDark: boolean;
    toggleTheme: () => void;
    colorTheme: string;
    setColorTheme: (theme: ThemeColor) => void;
}) {
    const themeColor = THEME_COLORS.find(c => c.id === colorTheme) || THEME_COLORS[0];

    return (
        <div className="space-y-6 animate-fade-slide-up">
            <div
                className="p-6 rounded-2xl text-white shadow-lg relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${themeColor.primary} 0%, ${themeColor.dark} 100%)`
                }}
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Palette className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-semibold mb-2">主题预览</h3>
                    <p className="text-white/80">这是您选择的主题色效果预览</p>
                </div>
            </div>

            <div className={`
                p-6 rounded-2xl shadow-sm
                ${isDark ? 'glass-dark-theme' : 'glass'}
            `}>
                <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">外观偏好</h3>

                <div className="flex items-center justify-between p-4 rounded-xl mb-4" style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                }}>
                    <div className="flex items-center gap-3">
                        {isDark ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                        <div>
                            <p className="font-medium text-slate-800 dark:text-white">深色模式</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">切换明暗主题</p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`
                            w-14 h-8 rounded-full transition-all duration-300 relative
                            ${isDark ? 'bg-[var(--color-theme)]' : 'bg-slate-300'}
                        `}
                    >
                        <span
                            className={`
                                absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300
                                ${isDark ? 'left-7' : 'left-1'}
                            `}
                        />
                    </button>
                </div>
            </div>

            <div className={`
                p-6 rounded-2xl shadow-sm
                ${isDark ? 'glass-dark-theme' : 'glass'}
            `}>
                <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">主题颜色</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">选择您喜欢的主题颜色</p>

                <div className="grid grid-cols-4 gap-3">
                    {THEME_COLORS.map((color) => {
                        const isSelected = colorTheme === color.id;

                        return (
                            <button
                                key={color.id}
                                onClick={() => setColorTheme(color.id)}
                                className={`
                                    relative p-4 rounded-xl transition-all duration-200 hover-lift
                                    ${isSelected ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900' : ''}
                                `}
                                style={{
                                    background: `linear-gradient(135deg, ${color.primary} 0%, ${color.dark} 100%)`,
                                    '--tw-ring-color': color.primary,
                                } as React.CSSProperties}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded-full bg-white shadow-sm"
                                        style={{ backgroundColor: color.light }}
                                    />
                                    <span className="text-xs font-medium text-white">{color.name}</span>
                                </div>
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                                        <Check className="w-4 h-4" style={{ color: color.primary }} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ============ API 配置 ============
function ApiTab() {
    const [apis, setApis] = useState<settingsService.ApiConfig[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingApi, setEditingApi] = useState<settingsService.ApiConfig | null>(null);
    const [testing, setTesting] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ id: string; success: boolean } | null>(null);

    // 表单状态
    const [formData, setFormData] = useState({
        name: '',
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        format: 'openai' as 'openai' | 'anthropic' | 'custom',
    });

    useEffect(() => {
        setApis(settingsService.getLlmApis());
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
            format: 'openai',
        });
        setEditingApi(null);
        setShowForm(false);
    };

    const handleSave = () => {
        if (!formData.name || !formData.apiKey || !formData.baseUrl) return;

        if (editingApi) {
            settingsService.updateLlmApi(editingApi.id, formData);
        } else {
            settingsService.saveLlmApi({ ...formData, isActive: apis.length === 0 });
        }
        setApis(settingsService.getLlmApis());
        resetForm();
    };

    const handleEdit = (api: settingsService.ApiConfig) => {
        setFormData({
            name: api.name,
            apiKey: api.apiKey,
            baseUrl: api.baseUrl,
            model: api.model,
            format: api.format,
        });
        setEditingApi(api);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        settingsService.deleteLlmApi(id);
        setApis(settingsService.getLlmApis());
    };

    const handleSetActive = (id: string) => {
        settingsService.setActiveLlmApi(id);
        setApis(settingsService.getLlmApis());
    };

    const handleTest = async (api: settingsService.ApiConfig) => {
        setTesting(api.id);
        setTestResult(null);
        try {
            const success = await testApiConnection(api);
            setTestResult({ id: api.id, success });
        } catch {
            setTestResult({ id: api.id, success: false });
        }
        setTesting(null);
    };

    const activeApiId = settingsService.getSettings().activeLlmApiId;

    return (
        <div className="space-y-6">
            {/* API 列表 */}
            <Card
                title="LLM API 配置"
                action={
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1 px-3 py-1.5 shape-full text-sm"
                        style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                    >
                        <Plus className="w-4 h-4" />
                        添加
                    </button>
                }
            >
                {apis.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--md-on-surface-variant)' }}>
                        <Key className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--md-outline)' }} />
                        <p>尚未配置任何 API</p>
                        <p className="text-sm mt-1">点击上方"添加"按钮开始配置</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {apis.map((api) => (
                            <div
                                key={api.id}
                                className="p-4 shape-lg flex items-center gap-4 group"
                                style={{
                                    backgroundColor: api.id === activeApiId
                                        ? 'var(--md-primary-container)'
                                        : 'var(--md-surface-container-highest)',
                                }}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium" style={{ color: 'var(--md-on-surface)' }}>
                                            {api.name}
                                        </span>
                                        {api.id === activeApiId && (
                                            <span className="text-xs px-2 py-0.5 shape-full" style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                                                当前使用
                                            </span>
                                        )}
                                        {testResult?.id === api.id && (
                                            <span
                                                className="text-xs px-2 py-0.5 shape-full"
                                                style={{
                                                    backgroundColor: testResult.success ? 'var(--md-tertiary-container)' : 'var(--md-error-container)',
                                                    color: testResult.success ? 'var(--md-on-tertiary-container)' : 'var(--md-on-error-container)',
                                                }}
                                            >
                                                {testResult.success ? '连接成功' : '连接失败'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                                        {api.model} · {api.format}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleTest(api)}
                                        disabled={testing === api.id}
                                        className="p-2 shape-full"
                                        style={{ color: 'var(--md-primary)' }}
                                        title="测试连接"
                                    >
                                        {testing === api.id ? (
                                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                        ) : (
                                            <Zap className="w-4 h-4" />
                                        )}
                                    </button>
                                    {api.id !== activeApiId && (
                                        <button
                                            onClick={() => handleSetActive(api.id)}
                                            className="p-2 shape-full"
                                            style={{ color: 'var(--md-secondary)' }}
                                            title="设为当前"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(api)}
                                        className="p-2 shape-full"
                                        style={{ color: 'var(--md-on-surface-variant)' }}
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(api.id)}
                                        className="p-2 shape-full"
                                        style={{ color: 'var(--md-error)' }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* 添加/编辑表单 */}
            {showForm && (
                <Card title={editingApi ? '编辑 API' : '添加 API'}>
                    <div className="space-y-4">
                        <InputField label="名称" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} placeholder="例如: OpenAI GPT-4" />
                        <InputField label="API Key" value={formData.apiKey} onChange={(v) => setFormData({ ...formData, apiKey: v })} placeholder="sk-..." type="password" />
                        <InputField label="Base URL" value={formData.baseUrl} onChange={(v) => setFormData({ ...formData, baseUrl: v })} placeholder="https://api.openai.com/v1" />
                        <InputField label="模型" value={formData.model} onChange={(v) => setFormData({ ...formData, model: v })} placeholder="gpt-4o-mini" />
                        <div>
                            <label className="block text-sm mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>API 格式</label>
                            <div className="flex gap-2">
                                {(['openai', 'anthropic', 'custom'] as const).map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setFormData({ ...formData, format: fmt })}
                                        className="px-4 py-2 shape-full text-sm"
                                        style={{
                                            backgroundColor: formData.format === fmt ? 'var(--md-primary)' : 'var(--md-surface-container-highest)',
                                            color: formData.format === fmt ? 'var(--md-on-primary)' : 'var(--md-on-surface)',
                                        }}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleSave} className="flex-1 py-2.5 shape-full font-medium flex items-center justify-center gap-2" style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                                <Save className="w-4 h-4" />
                                保存
                            </button>
                            <button onClick={resetForm} className="px-6 py-2.5 shape-full" style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)' }}>
                                取消
                            </button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

// ============ 提示词管理 ============
function PromptTab() {
    const [settings, setSettings] = useState(settingsService.getSettings());
    const [customPrompts, setCustomPrompts] = useState(promptService.getSavedPrompts());
    const [showAddPrompt, setShowAddPrompt] = useState(false);
    const [newPromptName, setNewPromptName] = useState('');
    const [newPromptContent, setNewPromptContent] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);

    const refreshSettings = () => setSettings(settingsService.getSettings());
    const refreshPrompts = () => setCustomPrompts(promptService.getSavedPrompts());

    const handleScaffoldingChange = (mode: settingsService.UserSettings['scaffoldingMode']) => {
        settingsService.saveSettings({ scaffoldingMode: mode });
        refreshSettings();
    };

    const handlePersonaChange = (persona: settingsService.UserSettings['persona']) => {
        settingsService.saveSettings({ persona });
        refreshSettings();
    };

    const handlePromptModeChange = (mode: 'composed' | 'custom') => {
        settingsService.saveSettings({ promptMode: mode });
        refreshSettings();
    };

    const handleAddPrompt = () => {
        if (!newPromptName.trim() || !newPromptContent.trim()) return;
        promptService.saveCustomPrompt(newPromptName.trim(), newPromptContent.trim());
        refreshPrompts();
        setNewPromptName('');
        setNewPromptContent('');
        setShowAddPrompt(false);
    };

    const handleDeletePrompt = (id: string) => {
        promptService.deleteCustomPrompt(id);
        if (settings.activePromptId === id) {
            settingsService.saveSettings({ activePromptId: '', promptMode: 'composed' });
            refreshSettings();
        }
        refreshPrompts();
    };

    const handleSelectPrompt = (id: string) => {
        settingsService.saveSettings({ activePromptId: id, promptMode: 'custom' });
        refreshSettings();
    };

    const scaffoldingModes: { value: settingsService.UserSettings['scaffoldingMode']; label: string; desc: string }[] = [
        { value: 'rush', label: '直接模式', desc: '快速给出答案和代码' },
        { value: 'balanced', label: '平衡模式', desc: '先解释再给答案' },
        { value: 'socratic', label: '苏格拉底', desc: '通过提问引导思考' },
    ];

    const personas: { value: settingsService.UserSettings['persona']; label: string; desc: string }[] = [
        { value: 'senior', label: '学长/学姐', desc: '亲切随意，分享经验' },
        { value: 'professor', label: '教授', desc: '专业严谨，强调基础' },
        { value: 'friend', label: '朋友', desc: '轻松幽默，情感支持' },
    ];

    return (
        <div className="space-y-6">
            {/* 提示词模式 */}
            <Card title="提示词模式">
                <div className="flex gap-3">
                    <button
                        onClick={() => handlePromptModeChange('composed')}
                        className="flex-1 p-4 shape-lg text-left"
                        style={{
                            backgroundColor: settings.promptMode === 'composed' ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                            border: settings.promptMode === 'composed' ? '2px solid var(--md-primary)' : '2px solid transparent',
                        }}
                    >
                        <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>组合模式</p>
                        <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>金牌辅导员 + 引导模式 + 人格</p>
                    </button>
                    <button
                        onClick={() => handlePromptModeChange('custom')}
                        className="flex-1 p-4 shape-lg text-left"
                        style={{
                            backgroundColor: settings.promptMode === 'custom' ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                            border: settings.promptMode === 'custom' ? '2px solid var(--md-primary)' : '2px solid transparent',
                        }}
                    >
                        <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>自定义模式</p>
                        <p className="text-sm" style={{ color: 'var(--md-on-surface-variant)' }}>使用自定义提示词</p>
                    </button>
                </div>
            </Card>

            {/* 组合模式设置 */}
            {settings.promptMode === 'composed' && (
                <>
                    <Card title="引导模式">
                        <div className="grid grid-cols-3 gap-3">
                            {scaffoldingModes.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => handleScaffoldingChange(m.value)}
                                    className="p-4 shape-lg text-left transition-all"
                                    style={{
                                        backgroundColor: settings.scaffoldingMode === m.value ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                                        border: settings.scaffoldingMode === m.value ? '2px solid var(--md-primary)' : '2px solid transparent',
                                    }}
                                >
                                    <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>{m.label}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>{m.desc}</p>
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card title="AI 人格">
                        <div className="grid grid-cols-3 gap-3">
                            {personas.map((p) => (
                                <button
                                    key={p.value}
                                    onClick={() => handlePersonaChange(p.value)}
                                    className="p-4 shape-lg text-left transition-all"
                                    style={{
                                        backgroundColor: settings.persona === p.value ? 'var(--md-primary-container)' : 'var(--md-surface-container-highest)',
                                        border: settings.persona === p.value ? '2px solid var(--md-primary)' : '2px solid transparent',
                                    }}
                                >
                                    <p className="font-medium" style={{ color: 'var(--md-on-surface)' }}>{p.label}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>{p.desc}</p>
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card title="预览当前提示词">
                        <button
                            onClick={() => setPreviewOpen(!previewOpen)}
                            className="w-full text-left p-3 shape-lg flex items-center justify-between"
                            style={{ backgroundColor: 'var(--md-surface-container-highest)' }}
                        >
                            <span style={{ color: 'var(--md-on-surface)' }}>
                                {promptService.getActivePromptInfo().name}
                            </span>
                            <ChevronRight className={`w-5 h-5 transition-transform ${previewOpen ? 'rotate-90' : ''}`} style={{ color: 'var(--md-on-surface-variant)' }} />
                        </button>
                        {previewOpen && (
                            <pre
                                className="mt-3 p-4 shape-lg text-xs overflow-x-auto max-h-96 overflow-y-auto"
                                style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)' }}
                            >
                                {promptService.buildSystemPrompt()}
                            </pre>
                        )}
                    </Card>
                </>
            )}

            {/* 自定义提示词 */}
            <Card
                title="自定义提示词"
                action={
                    <button
                        onClick={() => setShowAddPrompt(true)}
                        className="flex items-center gap-1 px-3 py-1.5 shape-full text-sm"
                        style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                    >
                        <Plus className="w-4 h-4" />
                        新建
                    </button>
                }
            >
                {customPrompts.length === 0 ? (
                    <p className="text-center py-6" style={{ color: 'var(--md-on-surface-variant)' }}>
                        暂无自定义提示词
                    </p>
                ) : (
                    <div className="space-y-2">
                        {customPrompts.map((p) => (
                            <div
                                key={p.id}
                                className="p-3 shape-lg flex items-center gap-3 cursor-pointer"
                                style={{
                                    backgroundColor:
                                        settings.promptMode === 'custom' && settings.activePromptId === p.id
                                            ? 'var(--md-primary-container)'
                                            : 'var(--md-surface-container-highest)',
                                }}
                                onClick={() => handleSelectPrompt(p.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate" style={{ color: 'var(--md-on-surface)' }}>{p.name}</p>
                                    <p className="text-xs truncate" style={{ color: 'var(--md-on-surface-variant)' }}>
                                        {p.content.substring(0, 50)}...
                                    </p>
                                </div>
                                {settings.promptMode === 'custom' && settings.activePromptId === p.id && (
                                    <Check className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeletePrompt(p.id); }}
                                    className="p-1.5"
                                    style={{ color: 'var(--md-error)' }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* 添加提示词表单 */}
            {showAddPrompt && (
                <Card title="新建自定义提示词">
                    <div className="space-y-4">
                        <InputField label="名称" value={newPromptName} onChange={setNewPromptName} placeholder="例如: 论文写作助手" />
                        <div>
                            <label className="block text-sm mb-2" style={{ color: 'var(--md-on-surface-variant)' }}>提示词内容</label>
                            <textarea
                                value={newPromptContent}
                                onChange={(e) => setNewPromptContent(e.target.value)}
                                rows={8}
                                className="w-full p-3 shape-lg text-sm resize-none"
                                placeholder="输入系统提示词..."
                                style={{
                                    backgroundColor: 'var(--md-surface-container-highest)',
                                    color: 'var(--md-on-surface)',
                                    border: '1px solid var(--md-outline)',
                                }}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAddPrompt} className="flex-1 py-2.5 shape-full font-medium" style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}>
                                保存
                            </button>
                            <button onClick={() => setShowAddPrompt(false)} className="px-6 py-2.5 shape-full" style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)' }}>
                                取消
                            </button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

// ============ 通用组件 ============
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
    const { isDark } = useTheme();

    return (
        <div className={`p-6 rounded-2xl shadow-sm ${isDark ? 'glass-dark-theme' : 'glass'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    const { isDark } = useTheme();

    return (
        <div>
            <label className="block text-sm mb-2 text-slate-600 dark:text-slate-400">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                    color: 'var(--md-on-surface)',
                    border: '1px solid var(--md-outline-variant)',
                }}
            />
        </div>
    );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const { isDark } = useTheme();

    return (
        <div>
            <label className="block text-sm mb-2 text-slate-600 dark:text-slate-400">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer border-none shadow-sm"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
                    style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                        color: 'var(--md-on-surface)',
                        border: '1px solid var(--md-outline-variant)',
                    }}
                />
            </div>
        </div>
    );
}
