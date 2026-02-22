import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, Trash2, FolderOpen, FileText, UploadCloud, RefreshCw, AlertCircle, Search } from 'lucide-react';

interface Collection {
    name: string;
    count: number;
}

interface DocFile {
    filename: string;
    chunks: number;
}

export default function KnowledgeBasePage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [activeCollection, setActiveCollection] = useState<string | null>("default");
    const [files, setFiles] = useState<DocFile[]>([]);

    const [loading, setLoading] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [showNewCol, setShowNewCol] = useState(false);

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchCollections = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8500/api/v1/rag/collections');
            if (res.ok) {
                const data = await res.json();
                setCollections(data.data || []);
            }
        } catch (e) {
            console.error("Failed to fetch collections", e);
        }
    };

    const fetchFiles = async (colName: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8500/api/v1/rag/collections/${colName}/files`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data.data || []);
            }
        } catch (e) {
            console.error("Failed to fetch files", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        if (activeCollection) {
            fetchFiles(activeCollection);
        } else {
            setFiles([]);
        }
    }, [activeCollection]);

    const handleCreateCollection = async () => {
        if (!newColName.trim()) return;
        try {
            const res = await fetch('http://127.0.0.1:8500/api/v1/rag/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newColName.trim() })
            });
            if (res.ok) {
                setNewColName('');
                setShowNewCol(false);
                fetchCollections();
                setActiveCollection(newColName.trim());
            }
        } catch (e) {
            console.error("Error creating collection", e);
        }
    };

    const handleDeleteCollection = async (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`确认删除集合 [${name}] 及其所有向量数据？此操作不可逆！`)) return;
        try {
            const res = await fetch(`http://127.0.0.1:8500/api/v1/rag/collections/${name}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                if (activeCollection === name) setActiveCollection(null);
                fetchCollections();
            }
        } catch (e) {
            console.error("Error deleting collection", e);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !activeCollection) return;
        const selectedFiles = Array.from(e.target.files);
        setUploading(true);

        for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('collection_name', activeCollection);
            try {
                await fetch('http://127.0.0.1:8500/api/v1/rag/upload', {
                    method: 'POST',
                    body: formData
                });
            } catch (err) {
                console.error("RAG Upload Error", err);
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = '';

        // Polling loop to wait for backend processing to finish (hacky but simple)
        setTimeout(() => {
            setUploading(false);
            fetchFiles(activeCollection);
            fetchCollections();
        }, 3000);
    };

    return (
        <div className="flex h-full p-4 md:p-6 gap-6">
            {/* Left Panel: Collections */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-1/3 max-w-sm flex flex-col glass-panel rounded-3xl overflow-hidden shadow-xl border border-white/50 dark:border-slate-700/50"
            >
                <div className="p-5 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-500" />
                        数据集合 (Collections)
                    </h2>
                    <button
                        onClick={() => setShowNewCol(true)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {showNewCol && (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-2">
                            <input
                                autoFocus
                                value={newColName}
                                onChange={e => setNewColName(e.target.value)}
                                placeholder="输入集合名称..."
                                className="flex-1 bg-transparent outline-none text-sm placeholder-slate-400"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreateCollection();
                                    if (e.key === 'Escape') setShowNewCol(false);
                                }}
                            />
                            <button onClick={handleCreateCollection} className="text-indigo-500 text-xs font-bold shrink-0">确认</button>
                        </div>
                    )}

                    {collections.map(col => (
                        <div
                            key={col.name}
                            onClick={() => setActiveCollection(col.name)}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between group ${activeCollection === col.name
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                                    : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <FolderOpen className={`w-5 h-5 ${activeCollection === col.name ? 'text-indigo-500' : 'text-slate-400'}`} />
                                <div>
                                    <div className={`font-semibold text-sm ${activeCollection === col.name ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>
                                        {col.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        包含 {col.count} 个向量块
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDeleteCollection(col.name, e)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {collections.length === 0 && !showNewCol && (
                        <div className="text-center p-8 text-slate-400 text-sm">
                            还没有任何知识集合，点击右上角+号创建
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Right Panel: Files in Collection */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col glass-panel rounded-3xl overflow-hidden shadow-xl border border-white/50 dark:border-slate-700/50"
            >
                {activeCollection ? (
                    <>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-1">
                                    {activeCollection}
                                </h1>
                                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    此集合下的文档内容将被作为 RAG 的独立溯源知识网络。
                                </p>
                            </div>

                            {/* Upload Area */}
                            <div className="relative">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".txt,.md,.pdf,.docx"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                    {uploading ? '知识入库中...' : '上传知识文档'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                                    <p>读取数据索引中...</p>
                                </div>
                            ) : files.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {files.map(file => (
                                            <motion.div
                                                key={file.filename}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <h3 className="font-bold text-sm truncate mb-1" title={file.filename}>
                                                        {file.filename}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                                        被切割为 <span className="font-bold text-indigo-500">{file.chunks}</span> 个检索块
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <Search className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-lg font-semibold text-slate-500">此集合是空的</p>
                                    <p className="text-sm mt-2 max-w-sm text-center">点击右上角的上传按钮将研究文献拖入，大模型就能基于该维度的专属语料与您对话了！</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Database className="w-16 h-16 mb-6 opacity-20" />
                        <h2 className="text-xl font-bold text-slate-500">请选择或创建一个知识集合</h2>
                        <p className="text-sm mt-3 text-slate-400 max-w-md text-center">
                            每个业务场景建立不同的 Collection 有助于让大模型在最纯净的垂域上下文中为您进行推演，避免不同部门知识交叉“幻觉”。
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
