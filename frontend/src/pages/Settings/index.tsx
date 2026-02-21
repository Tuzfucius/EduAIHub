import React, { useState, useEffect } from 'react';
import { User, Key, Sliders, BookOpen, Bot, Save, RotateCcw, Eye, EyeOff, Check, ChevronRight, Sparkles, GraduationCap, MessageSquare, Plus, Trash2, Edit2, X, Globe, Zap, Heart } from 'lucide-react';
import * as settingsService from '@/services/settingsService';
import * as promptService from '@/services/promptService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

type TabId = 'account' | 'llm-api' | 'scaffolding' | 'persona' | 'prompts';

const gradeLabels: Record<string, string> = {
    freshman: '大一',
    sophomore: '大二',
    junior: '大三',
    senior: '大四',
    graduate: '研究生',
    phd: '博士',
};

export default function SettingsPage() {
    const { user } = useAuth();
    const userId = user?.username || 'guest';
    const [activeTab, setActiveTab] = useState<TabId>('account');
    const [settings, setSettings] = useState<settingsService.UserSettings>(settingsService.getSettings());
    const [saved, setSaved] = useState(false);
    const [promptPreview, setPromptPreview] = useState('');

    // Edit modes
    const [editingName, setEditingName] = useState(false);
    const [editingGrade, setEditingGrade] = useState(false);
    const [tempName, setTempName] = useState('');
    const [tempGrade, setTempGrade] = useState('');

    // API Management
    const [llmApis, setLlmApis] = useState<settingsService.ApiConfig[]>([]);
    const [showAddLlmModal, setShowAddLlmModal] = useState(false);
    const [showApiKey, setShowApiKey] = useState<string | null>(null);

    // Prompt Management
    const [savedPrompts, setSavedPrompts] = useState<promptService.SavedPrompt[]>([]);

    // New API form
    const [newApiForm, setNewApiForm] = useState({
        name: '',
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: '',
        format: 'openai' as 'openai' | 'anthropic' | 'custom',
    });

    useEffect(() => {
        if (userId) {
            settingsService.setCurrentUser(userId);
            setSettings(settingsService.getSettings());
            setLlmApis(settingsService.getLlmApis());
        }
        setSavedPrompts(promptService.getSavedPrompts());
    }, [userId]);

    useEffect(() => {
        setPromptPreview(promptService.buildSystemPrompt(settings));
    }, [settings]);

    const refreshApis = () => {
        setLlmApis(settingsService.getLlmApis());
        setSettings(settingsService.getSettings());
    };

    const handleSave = () => {
        settingsService.saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        const defaultSettings = settingsService.resetSettings();
        setSettings(defaultSettings);
    };

    const updateSettings = (updates: Partial<settingsService.UserSettings>) => {
        const updated = { ...settings, ...updates };
        setSettings(updated);
        settingsService.saveSettings(updated);
    };

    const handleSaveName = () => {
        updateSettings({ displayName: tempName });
        setEditingName(false);
    };

    const handleSaveGrade = () => {
        updateSettings({ grade: tempGrade });
        setEditingGrade(false);
    };

    const handleAddLlmApi = () => {
        if (!newApiForm.name || !newApiForm.apiKey) return;
        settingsService.saveLlmApi({
            name: newApiForm.name,
            apiKey: newApiForm.apiKey,
            baseUrl: newApiForm.baseUrl,
            model: newApiForm.model,
            format: newApiForm.format,
            isActive: llmApis.length === 0,
        });
        setNewApiForm({ name: '', apiKey: '', baseUrl: 'https://api.openai.com/v1', model: '', format: 'openai' });
        setShowAddLlmModal(false);
        refreshApis();
    };

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'account', label: '账户信息', icon: <User className="w-4 h-4" /> },
        { id: 'llm-api', label: 'LLM API 管理', icon: <Key className="w-4 h-4" /> },
        { id: 'scaffolding', label: '引导模式', icon: <Sliders className="w-4 h-4" /> },
        { id: 'persona', label: 'AI 人格', icon: <Bot className="w-4 h-4" /> },
        { id: 'prompts', label: '提示词管理', icon: <MessageSquare className="w-4 h-4" /> },
    ];

    const ApiCard = ({ api, type }: { api: settingsService.ApiConfig; type: 'llm' }) => {
        const isActive = settings.activeLlmApiId === api.id;
        const showKey = showApiKey === api.id;

        return (
            <div className={`p-4 rounded-xl border-2 transition-all ${isActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-600'}`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-800 dark:text-white">{api.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${api.format === 'openai' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                api.format === 'anthropic' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                {api.format.toUpperCase()}
                            </span>
                            {isActive && (
                                <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs">使用中</span>
                            )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                    {showKey ? api.apiKey : 'sk-' + '*'.repeat(16) + api.apiKey.slice(-4)}
                                </span>
                                <button
                                    onClick={() => setShowApiKey(showKey ? null : api.id)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div>模型: {api.model || '未指定 (跟随前端)'}</div>
                            <div className="truncate">URL: {api.baseUrl}</div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        {!isActive && (
                            <button
                                onClick={() => {
                                    settingsService.setActiveLlmApi(api.id);
                                    refreshApis();
                                }}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all"
                            >
                                启用
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (confirm('确定删除此 API 配置？')) {
                                    settingsService.deleteLlmApi(api.id);
                                    refreshApis();
                                }
                            }}
                            className="px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const AddApiModal = ({ isOpen, onClose, onSubmit, title }: { isOpen: boolean; onClose: () => void; onSubmit: () => void; title: string }) => (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onMouseDown={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" />{title}</h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">配置名称 *</label>
                                <input
                                    type="text"
                                    value={newApiForm.name}
                                    onChange={e => setNewApiForm({ ...newApiForm, name: e.target.value })}
                                    placeholder="例如：DeepSeek 专属通道"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API 格式</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['openai', 'custom'] as const).map(format => (
                                        <button
                                            key={format}
                                            onClick={() => setNewApiForm({ ...newApiForm, format })}
                                            className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${newApiForm.format === format
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-600'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {format === 'openai' && 'OpenAI 兼容'}
                                            {format === 'custom' && '自定义'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Key *</label>
                                <input
                                    type="password"
                                    value={newApiForm.apiKey}
                                    onChange={e => setNewApiForm({ ...newApiForm, apiKey: e.target.value })}
                                    placeholder="sk-..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Base URL</label>
                                <input
                                    type="text"
                                    value={newApiForm.baseUrl}
                                    onChange={e => setNewApiForm({ ...newApiForm, baseUrl: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">模型名称</label>
                                <input
                                    type="text"
                                    value={newApiForm.model}
                                    onChange={e => setNewApiForm({ ...newApiForm, model: e.target.value })}
                                    placeholder="例如：deepseek-chat"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                取消
                            </button>
                            <button
                                onClick={onSubmit}
                                disabled={!newApiForm.name || !newApiForm.apiKey}
                                className="flex-1 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                立即添加网络
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="h-screen w-full flex flex-col pt-4 pr-4 pl-4 sm:pl-0 pb-4 md:pb-20 lg:pb-4 relative">
            <div className="glass-panel rounded-[2rem] border-white/40 dark:border-white/10 shadow-2xl flex flex-col md:flex-row flex-1 overflow-hidden h-full">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">EduAI 全局设置</h2>
                    <nav className="space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 font-medium'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </button>
                        ))}
                    </nav>

                    {/* Save Button */}
                    <div className="mt-auto pt-8 space-y-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg ${saved
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-purple-500/20'
                                }`}
                        >
                            {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {saved ? '已保存设置' : '保存全局偏好'}
                        </motion.button>
                        <button
                            onClick={handleReset}
                            className="w-full py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-2 text-sm font-semibold"
                        >
                            <RotateCcw className="w-4 h-4" />
                            重置兜底网关
                        </button>
                    </div>
                </div>

                {/* Content View Container */}
                <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-white/20 dark:bg-slate-900/20">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-3xl"
                        >
                            {/* Account Tab */}
                            {activeTab === 'account' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">网络身份识别卡</h3>
                                        <p className="text-slate-500 dark:text-slate-400">我们将依据此信息为您提供个性化的教学体验，它并不会覆盖您的账号资料。</p>
                                    </div>

                                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
                                        {/* Display Name */}
                                        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700">
                                            <div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-bold">虚拟学名</div>
                                                {editingName ? (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <input
                                                            type="text"
                                                            value={tempName}
                                                            onChange={e => setTempName(e.target.value)}
                                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                                                            autoFocus
                                                        />
                                                        <button onClick={handleSaveName} className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingName(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="font-bold text-lg text-slate-800 dark:text-white mt-1">
                                                        {settings.displayName || user?.username || '未设定（游客）'}
                                                    </div>
                                                )}
                                            </div>
                                            {!editingName && (
                                                <button
                                                    onClick={() => { setTempName(settings.displayName); setEditingName(true); }}
                                                    className="px-4 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-xl text-sm flex items-center gap-2 font-bold transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    修改身份
                                                </button>
                                            )}
                                        </div>

                                        {/* Grade */}
                                        <div className="flex items-center justify-between py-3">
                                            <div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-bold">当前学段</div>
                                                {editingGrade ? (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <select
                                                            value={tempGrade}
                                                            onChange={e => setTempGrade(e.target.value)}
                                                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-medium"
                                                        >
                                                            <option value="">请揭示学段</option>
                                                            <option value="freshman">大一萌新</option>
                                                            <option value="sophomore">大二老司机</option>
                                                            <option value="junior">大三攻坚</option>
                                                            <option value="senior">大四闲鱼</option>
                                                            <option value="graduate">究极研究生</option>
                                                            <option value="phd">博士塔</option>
                                                        </select>
                                                        <button onClick={handleSaveGrade} className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingGrade(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="font-bold text-lg text-slate-800 dark:text-white mt-1">
                                                        {gradeLabels[settings.grade] || '未注册（基础辅导）'}
                                                    </div>
                                                )}
                                            </div>
                                            {!editingGrade && (
                                                <button
                                                    onClick={() => { setTempGrade(settings.grade); setEditingGrade(true); }}
                                                    className="px-4 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-xl text-sm flex items-center gap-2 font-bold transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    变更进程
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LLM API Tab */}
                            {activeTab === 'llm-api' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">核心认知引擎通道</h3>
                                            <p className="text-slate-500 dark:text-slate-400">注入您的私钥，自由挂载 DeepSeek、OpenAI、Kimi 等多态开源流</p>
                                        </div>
                                        <button
                                            onClick={() => setShowAddLlmModal(true)}
                                            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-2 font-bold"
                                        >
                                            <Plus className="w-5 h-5" />
                                            新建链接池
                                        </button>
                                    </div>

                                    {llmApis.length === 0 ? (
                                        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-3xl p-16 border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Key className="w-10 h-10 text-slate-400" />
                                            </div>
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">未接入第三方引擎</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">系统将静默跌回至管理员于后端 \`.env\` 部署的保底大模型网关上。</p>
                                            <button
                                                onClick={() => setShowAddLlmModal(true)}
                                                className="px-6 py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-800 rounded-xl hover:opacity-90 font-bold transition-all shadow-xl"
                                            >
                                                立即植入 (Bring Your Own Key)
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {llmApis.map(api => (
                                                <ApiCard key={api.id} api={api} type="llm" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Scaffolding Tab */}
                            {activeTab === 'scaffolding' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">知识萃取协议 (Scaffolding)</h3>
                                        <p className="text-slate-500 dark:text-slate-400">控制 AI Solver 对您输送答案时的缓冲深度与反问率</p>
                                    </div>

                                    {settings.promptMode === 'custom' && (
                                        <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-xl text-amber-700 dark:text-amber-400 font-medium">
                                            🚧 当前您正在全量覆盖自定义提示词。Scaffolding 参数将不会参与组合，请切换到组合模式放行。
                                        </div>
                                    )}

                                    <div className={`space-y-6 ${settings.promptMode === 'custom' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            {([
                                                { mode: 'rush' as const, icon: <Zap className="w-7 h-7" />, title: '直接模式 (Rush)', desc: '免去分析折磨，直接将代码及最终成果交给我！', color: 'text-orange-500' },
                                                { mode: 'balanced' as const, icon: <Sparkles className="w-7 h-7" />, title: '平衡模式 (Balanced)', desc: '循序渐进讲述原理然后再给出结论。(推荐)', color: 'text-indigo-500' },
                                                { mode: 'socratic' as const, icon: <Globe className="w-7 h-7" />, title: '苏格拉底 (Socratic)', desc: '剥茧抽丝不给答案，反问引导至灵魂深处', color: 'text-emerald-500' },
                                            ]).map(item => (
                                                <button
                                                    key={item.mode}
                                                    onClick={() => updateSettings({ scaffoldingMode: item.mode })}
                                                    className={`p-6 rounded-3xl border-2 transition-all text-left bg-white dark:bg-slate-800 group shadow-sm hover:shadow-xl ${settings.scaffoldingMode === item.mode
                                                        ? 'border-purple-500 ring-4 ring-purple-500/10 scale-105'
                                                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                                        }`}
                                                >
                                                    <div className={`${item.color} mb-4 bg-slate-50 dark:bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>{item.icon}</div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-lg">{item.title}</h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Persona Tab */}
                            {activeTab === 'persona' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">数字人格图谱 (Persona)</h3>
                                        <p className="text-slate-500 dark:text-slate-400">为您配备契合心理周期的私教语气与交流频段</p>
                                    </div>

                                    {settings.promptMode === 'custom' && (
                                        <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-xl text-amber-700 dark:text-amber-400 font-medium">
                                            🚧 人格叠加功能处于休眠状态（原因：当前应用的是高度自定义的全貌 Prompt 集合）
                                        </div>
                                    )}

                                    <div className={`space-y-6 ${settings.promptMode === 'custom' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            {([
                                                { persona: 'senior' as const, icon: <GraduationCap className="w-7 h-7" />, title: '首席学姐', desc: '口吻亲切随性，会毫无保留传授摸鱼避坑的高分攻略。', color: 'text-purple-500' },
                                                { persona: 'professor' as const, icon: <BookOpen className="w-7 h-7" />, title: '严苛教授', desc: '绝对的一丝不苟。术语信手拈来，对细微谬误一针见血。', color: 'text-blue-500' },
                                                { persona: 'friend' as const, icon: <Heart className="w-7 h-7" />, title: '知心同桌', desc: '会在崩溃时提供情感价值，还会用超沙雕的比喻解开难题。', color: 'text-pink-500' },
                                            ]).map(item => (
                                                <button
                                                    key={item.persona}
                                                    onClick={() => updateSettings({ persona: item.persona })}
                                                    className={`p-6 rounded-3xl border-2 transition-all text-left bg-white dark:bg-slate-800 group shadow-sm hover:shadow-xl ${settings.persona === item.persona
                                                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 scale-105'
                                                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                                        }`}
                                                >
                                                    <div className={`${item.color} mb-4 bg-slate-50 dark:bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>{item.icon}</div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-lg">{item.title}</h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Prompts Tab */}
                            {activeTab === 'prompts' && (
                                <div className="space-y-6 flex flex-col min-h-full">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">意识矩阵装配台 (Prompts)</h3>
                                        <p className="text-slate-500 dark:text-slate-400">实时查阅并调制当前将输送到大模型的复合指令结构体</p>
                                    </div>

                                    {/* Current Mode Display */}
                                    <div className={`p-6 rounded-3xl border-2 shadow-sm ${settings.promptMode === 'custom' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700' : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700'}`}>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${settings.promptMode === 'custom' ? 'bg-amber-500 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                                                    <MessageSquare className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-1">
                                                        {settings.promptMode === 'custom' ? '绝对自定义独断模式' : 'EduAI 动态解构器 (模块化组装)'}
                                                    </h4>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                        {settings.promptMode === 'custom'
                                                            ? '已切断框架预设的"人格与脚手架"，大模型将严格且独占执行您的定制段落'
                                                            : '自动汲融 "金牌教员 + Scaffolding组件 + Persona人格" 三维交织成系统指令'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => updateSettings({ promptMode: settings.promptMode === 'custom' ? 'composed' : 'custom' })}
                                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-200 shrink-0 shadow-sm"
                                            >
                                                {settings.promptMode === 'custom' ? '回落动态组合' : '启用完全体重写'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Custom Prompts Management (only in composed mode) */}
                                    {settings.promptMode === 'composed' && (
                                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                            <h4 className="font-bold text-slate-800 dark:text-white mb-2">在架构尾部追加微调规则块</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">
                                                例如："在讲述高等数学题时，必须关联生活中的物理现象作比喻"
                                            </p>
                                            <textarea
                                                value={settings.customPromptSnippet}
                                                onChange={e => updateSettings({ customPromptSnippet: e.target.value })}
                                                placeholder="输入任何辅助指令，系统均会在发射前将其缝合于上下文末端..."
                                                rows={3}
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-slate-300 outline-none focus:ring-4 focus:ring-purple-500/20 font-medium text-sm transition-shadow resize-none"
                                            />
                                        </div>
                                    )}

                                    {/* Prompt Preview */}
                                    <div className="bg-slate-800 dark:bg-black rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col relative mt-4">
                                        <div className="absolute top-0 right-0 bg-blue-500 px-4 py-1.5 rounded-bl-xl text-xs font-bold text-white shadow-lg">FINAL PAYLOAD</div>
                                        <h4 className="font-bold text-slate-300 flex items-center gap-2 mb-4">
                                            <Bot className="w-5 h-5 text-indigo-400" />
                                            即时编译结果 (Preview)
                                        </h4>
                                        <div className="overflow-y-auto max-h-[400px] no-scrollbar rounded-xl bg-slate-900/50 p-5 border border-slate-700/50">
                                            <pre className="text-sm text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed">{promptPreview || '// Loading active system bounds...'}</pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
