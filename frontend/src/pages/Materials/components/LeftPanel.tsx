
import React, { useEffect, useState } from 'react';
import { useStudyStore } from '@/store/useStudyStore';
import { ragService, KnowledgeBase, KnowledgeFile } from '@/services/ragService';
import { Plus, Book, FileText, Loader2, RefreshCw } from 'lucide-react';
import { clsx } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export default function LeftPanel() {
    const { currentKb, setCurrentKb, setFiles, files, setPreviewFile } = useStudyStore();
    const { getGradientStyle } = useTheme();

    const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
    const [isLoadingKbs, setIsLoadingKbs] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newKbName, setNewKbName] = useState("");

    const fetchKbs = async () => {
        setIsLoadingKbs(true);
        try {
            const data = await ragService.getKnowledgeBases();
            setKbs(data);
            // Optionally auto-select first one if none selected
            if (!currentKb && data.length > 0) {
                setCurrentKb(data[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingKbs(false);
        }
    };

    useEffect(() => {
        fetchKbs();
    }, []);

    // Load files when currentKb changes
    useEffect(() => {
        if (currentKb) {
            ragService.getKbFiles(currentKb.id).then(setFiles).catch(console.error);
        } else {
            setFiles([]);
        }
    }, [currentKb, setFiles]);

    const handleCreateKb = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKbName.trim()) return;
        try {
            const newKb = await ragService.createKnowledgeBase(newKbName);
            setKbs([newKb, ...kbs]);
            setCurrentKb(newKb);
            setIsCreating(false);
            setNewKbName("");
        } catch (e) {
            alert("创建失败，请重试");
        }
    };

    return (
        <div className="h-full flex flex-col p-4 overflow-y-auto">
            {/* Header / KB Switcher */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-sm opacity-70">我的知识库</h2>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreateKb} className="mb-2">
                        <input
                            autoFocus
                            type="text"
                            className="w-full text-sm px-2 py-1 border rounded bg-transparent mb-1"
                            placeholder="输入学科名称..."
                            value={newKbName}
                            onChange={e => setNewKbName(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="text-xs px-2 py-1 bg-[var(--md-primary)] text-white rounded">确认</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="text-xs px-2 py-1 opacity-60">取消</button>
                        </div>
                    </form>
                )}

                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {kbs.map(kb => (
                        <button
                            key={kb.id}
                            onClick={() => setCurrentKb(kb)}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                                currentKb?.id === kb.id
                                    ? "bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)] font-medium"
                                    : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
                            )}
                        >
                            <Book size={14} />
                            <span className="truncate">{kb.name}</span>
                        </button>
                    ))}
                    {kbs.length === 0 && !isLoadingKbs && (
                        <div className="text-xs opacity-50 text-center py-2">暂无知识库</div>
                    )}
                </div>
            </div>

            <hr className="mb-6 border-[var(--md-outline-variant)] opacity-50" />

            {/* File Tree / Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-sm opacity-70">资料列表</h2>
                        {currentKb && <span className="text-xs opacity-50 bg-black/5 px-1 rounded">{files.length}</span>}
                    </div>
                </div>

                {!currentKb ? (
                    <div className="text-xs opacity-50 text-center py-10">请先选择或创建一个知识库</div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {files.map(file => (
                            <button
                                key={file.id}
                                onClick={() => setPreviewFile(file)}
                                className="group flex items-start gap-2 px-2 py-2 rounded hover:bg-black/5 dark:hover:bg-white/5 text-sm text-left relative"
                            >
                                <FileText size={16} className="mt-0.5 flex-shrink-0 opacity-70" />
                                <div className="flex-1 min-w-0">
                                    <div className="truncate">{file.filename}</div>
                                    <div className="text-[10px] opacity-50 flex gap-2">
                                        <span>{(file.file_size / 1024).toFixed(1)} KB</span>
                                        <span className={clsx(
                                            file.status === 'completed' ? 'text-green-500' :
                                                file.status === 'failed' ? 'text-red-500' : 'text-blue-500'
                                        )}>
                                            {file.status}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {files.length === 0 && (
                            <div className="text-xs opacity-50 text-center py-4">暂无文件，请在中间面板上传</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
