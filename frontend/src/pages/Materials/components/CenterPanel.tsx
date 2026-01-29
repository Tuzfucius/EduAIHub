
import React, { useRef, useState } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import { ragService } from '@/services/ragService';
import { UploadCloud, Play, FileText, ChevronRight, Brain, ListTree, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export default function CenterPanel() {
    const { currentKb, activeTab, previewFile, setActiveTab, setFiles, files, setPendingMessage, toggleRightPanel, isRightPanelOpen } = useStudyStore();
    const { getGradientStyle } = useTheme();
    const [isUploading, setIsUploading] = useState(false);
    const [isBuilding, setIsBuilding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);

    const handleMouseUp = () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelection({
                text: sel.toString(),
                x: rect.left + rect.width / 2,
                y: rect.top
            });
        } else {
            // setTimeout to allow button click to register if inside popover
            setTimeout(() => setSelection(null), 100);
        }
    };

    const handleAsk = (type: 'explain' | 'quiz') => {
        if (!selection) return;
        const msg = type === 'explain'
            ? `请解释这段话：\n"${selection.text}"`
            : `请基于这段话出3道单选题：\n"${selection.text}"`;

        setPendingMessage(msg);
        setSelection(null);
        if (!isRightPanelOpen) toggleRightPanel();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !currentKb) return;
        setIsUploading(true);
        try {
            const file = e.target.files[0];
            await ragService.uploadFile(currentKb.id, file);
            // Refresh files
            const newFiles = await ragService.getKbFiles(currentKb.id);
            setFiles(newFiles);
        } catch (e) {
            alert("上传失败");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleBuild = async () => {
        if (!currentKb) return;
        setIsBuilding(true);
        try {
            await ragService.buildIndex(currentKb.id);
            alert("索引构建任务已提交");
        } catch (e) {
            alert("构建失败");
        } finally {
            setIsBuilding(false);
        }
    };

    if (!currentKb) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 select-none">
                <Brain size={64} className="mb-4 opacity-20" />
                <p>请在左侧选择或创建一个知识库</p>
            </div>
        );
    }

    const tabs = [
        { id: 'files', label: '管理', icon: SettingsIcon },
        { id: 'preview', label: '阅览', icon: FileText },
        { id: 'quiz', label: '测试', icon: Play },
        { id: 'outline', label: '大纲', icon: ListTree },
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1a1b1e]">
            {/* Tab Bar */}
            <div className="flex items-center border-b px-2 gap-1 bg-[var(--md-surface)]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === tab.id
                                ? "border-[var(--md-primary)] text-[var(--md-primary)] bg-[var(--md-secondary-container)]"
                                : "border-transparent opacity-60 hover:opacity-100 hover:bg-black/5"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 relative">

                {activeTab === 'files' && (
                    <div className="max-w-2xl mx-auto space-y-8">
                        {/* Status Card */}
                        <div className="p-6 rounded-xl border bg-[var(--md-surface-container-low)]">
                            <h2 className="text-xl font-bold mb-2">{currentKb.name}</h2>
                            <div className="flex gap-4 text-sm opacity-70 mb-4">
                                <span>包含 {files.length} 个文件</span>
                                <span>状态: {currentKb.status}</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--md-primary)] text-white rounded-lg hover:brightness-110 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    <UploadCloud size={18} />
                                    {isUploading ? "上传中..." : "上传资料"}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />

                                <button
                                    onClick={handleBuild}
                                    disabled={isBuilding || files.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 border border-[var(--md-outline)] rounded-lg hover:bg-black/5 transition-all text-[var(--md-primary)]"
                                >
                                    <Brain size={18} />
                                    {isBuilding ? "构建中..." : "构建索引"}
                                </button>
                            </div>
                        </div>

                        {/* File Table */}
                        <div>
                            <h3 className="font-medium mb-4 opacity-80">文件清单</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[var(--md-surface-container)]">
                                        <tr className="border-b">
                                            <th className="px-4 py-3 font-medium">文件名</th>
                                            <th className="px-4 py-3 font-medium">大小</th>
                                            <th className="px-4 py-3 font-medium">状态</th>
                                            <th className="px-4 py-3 font-medium">上传时间</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {files.map(f => (
                                            <tr key={f.id} className="hover:bg-black/5">
                                                <td className="px-4 py-3">{f.filename}</td>
                                                <td className="px-4 py-3">{(f.file_size / 1024).toFixed(1)} KB</td>
                                                <td className="px-4 py-3">{f.status}</td>
                                                <td className="px-4 py-3 opacity-60">{new Date(f.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                        {files.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center opacity-50">暂无需索引的文件</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'preview' && (
                    <div className="h-full flex flex-col">
                        {!previewFile ? (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                                <FileText size={48} className="mb-4" />
                                <p>请在左侧选择要阅览的文件</p>
                            </div>
                        ) : (
                            <div className="h-full w-full bg-[#525659] flex flex-col">
                                <div className="bg-[#323639] text-white px-4 py-2 text-sm flex items-center justify-between shadow-sm z-10">
                                    <span className="truncate flex-1 font-medium">{previewFile.filename}</span>
                                    <span className="opacity-70 text-xs">PDF 预览模式</span>
                                </div>
                                {/* Simple iframe preview for MVP */}
                                {/* Need a way to serve file content. Currently backend stores local path. 
                                    API doesn't expose file content directly via generic static URL? 
                                    We might need a proxy endpoint or assumption. 
                                    Assumption: 'uploadFile' saves locally. 
                                    We need an endpoint GET /api/rag/file/{id}/content 
                                    Wait, my API doesn't have it yet. 
                                    I will add it or just mock it with a visual placeholder saying "Preview Unavailble in MVP" if not easy.
                                    Actually, I can implement a quick GET endpoint or use a Blob URL if I fetched it.
                                    For now, let's just show a PLACEHOLDER text content. 
                                */}
                                <div className="flex-1 bg-white p-8 overflow-auto" onMouseUp={handleMouseUp}>
                                    <div className="max-w-3xl mx-auto min-h-[800px] bg-white shadow-lg p-10 text-gray-800 selection:bg-yellow-200 selection:text-black">
                                        <h1 className="text-3xl font-bold mb-6 text-gray-900">{previewFile.filename}</h1>
                                        <p className="text-gray-600 mb-4 text-justify leading-relaxed">
                                            (文件预览功能暂需后端添加文件流接口。此处为模拟显示。)
                                            <br /><br />
                                            在实际应用中，这里将通过 PDF.js 或 iframe 加载真实 PDF 内容。
                                            <br />
                                            {Array(20).fill("This is a placeholder text line to simulate document content reading experience. ").join("")}
                                        </p>
                                        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 my-4 text-yellow-800">
                                            试着划选这段文字来使用 "Highlight-to-Ask" 功能！
                                        </div>
                                        <p className="text-gray-600 mb-4 text-justify leading-relaxed">
                                            {Array(30).fill("More placeholder text content for scroll testing. ").join("")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Highlight Popover */}
                {selection && (
                    <div
                        style={{ top: selection.y - 45, left: selection.x }}
                        className="fixed z-50 transform -translate-x-1/2 flex items-center gap-1 p-1 rounded-lg shadow-xl bg-[#2b2d31] text-white border border-white/10 animate-in fade-in zoom-in-95 duration-200"
                        onMouseDown={(e) => e.preventDefault()} // Prevent clearing selection when clicking buttons
                    >
                        <button
                            onClick={() => handleAsk('explain')}
                            className="px-3 py-1.5 text-xs font-medium hover:bg-white/10 rounded-md transition-colors flex items-center gap-1"
                        >
                            <Brain size={14} className="text-blue-400" />
                            解释
                        </button>
                        <div className="w-px h-4 bg-white/10" />
                        <button
                            onClick={() => handleAsk('quiz')}
                            className="px-3 py-1.5 text-xs font-medium hover:bg-white/10 rounded-md transition-colors flex items-center gap-1"
                        >
                            <Play size={14} className="text-green-400" />
                            出题
                        </button>
                    </div>
                )}

                {activeTab === 'quiz' && (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                        <Play size={48} className="mb-4" />
                        <p>点击按钮生成今日测试</p>
                        <button
                            onClick={() => {
                                setPendingMessage("请基于当前知识库，生成一份包含5道单选题的测试卷，包含答案解析。");
                                if (!isRightPanelOpen) toggleRightPanel();
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                            生成测试
                        </button>
                    </div>
                )}

                {activeTab === 'outline' && (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                        <ListTree size={48} className="mb-4" />
                        <p>点击按钮生成复习大纲</p>
                        <button
                            onClick={() => {
                                setPendingMessage("请基于当前知识库，生成一份详细的层级复习大纲，使用Markdown格式。");
                                if (!isRightPanelOpen) toggleRightPanel();
                            }}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                            生成大纲
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
