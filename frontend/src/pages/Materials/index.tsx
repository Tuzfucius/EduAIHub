import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, UploadCloud, Folder, File, FileText, Loader2, Plus, Download, Trash2, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';

// Interfaces
interface KnowledgeBase {
    id: int;
    name: string;
    description: string;
    created_at: string;
}

interface Document {
    id: int;
    filename: string;
    file_size: number;
    status: string;
}

export default function MaterialsPage() {
    const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
    const [activeKb, setActiveKb] = useState<KnowledgeBase | null>(null);
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [newKbName, setNewKbName] = useState('');

    const fetchKbs = async () => {
        try {
            const res = await api.get('/rag/kb');
            setKbs(res.data);
            if (res.data.length > 0 && !activeKb) {
                setActiveKb(res.data[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocs = async (kb_id: number) => {
        try {
            const res = await api.get(`/rag/kb/${kb_id}/documents`);
            setDocs(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchKbs();
    }, []);

    useEffect(() => {
        if (activeKb) {
            fetchDocs(activeKb.id);
        }
    }, [activeKb]);

    const handleCreateKb = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKbName.trim()) return;
        try {
            const res = await api.post('/rag/kb', { name: newKbName, description: '自动生成的智能知识库模块' });
            setKbs([...kbs, res.data]);
            setActiveKb(res.data);
            setNewKbName('');
        } catch (e) {
            alert("知识库创建失败");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeKb) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/rag/kb/${activeKb.id}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setDocs([...docs, res.data]);
        } catch (e) {
            alert('上传失败');
        } finally {
            setUploading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen p-4 md:p-8 xl:p-12 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-0 right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 dark:bg-emerald-600/20 blur-[150px] pointer-events-none -z-10" />

            <div className="max-w-[1600px] mx-auto h-full flex flex-col lg:flex-row gap-8">

                {/* KB Navigation Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full lg:w-80 flex flex-col gap-6"
                >
                    <div className="glass-panel p-6 rounded-[2rem] border-white/50 dark:border-white/10 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                        <h3 className="text-xl font-extrabold flex items-center gap-2 mb-6 tracking-tight">
                            <LibraryIcon className="w-5 h-5 text-emerald-500" /> 知识网络
                        </h3>

                        <form onSubmit={handleCreateKb} className="relative mb-6">
                            <input
                                value={newKbName}
                                onChange={e => setNewKbName(e.target.value)}
                                placeholder="新知识领域..."
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-all"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-colors shadow-md">
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="space-y-2">
                            {kbs.map(kb => (
                                <button
                                    key={kb.id}
                                    onClick={() => setActiveKb(kb)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-semibold ${activeKb?.id === kb.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                >
                                    <Folder className="w-5 h-5 fill-current opacity-80" />
                                    <span className="truncate flex-1 text-left">{kb.name}</span>
                                    {activeKb?.id === kb.id && <ArrowRight className="w-4 h-4 shrink-0" />}
                                </button>
                            ))}
                            {loading && <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div>}
                        </div>
                    </div>
                </motion.div>

                {/* Main Content Pane */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 glass-panel rounded-[2.5rem] p-6 lg:p-10 border-white/50 dark:border-white/10 shadow-2xl flex flex-col"
                >
                    {activeKb ? (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
                                <div>
                                    <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                                        {activeKb.name}
                                    </h2>
                                    <p className="text-slate-500 font-medium">包含该领域下的专属文献资料</p>
                                </div>

                                <label className="relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 px-6 py-4 shadow-xl shadow-emerald-500/20 text-white font-bold text-lg group">
                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
                                    {uploading ? '知识同化中...' : '上传新素材'}
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.md" disabled={uploading} />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-max overflow-y-auto no-scrollbar pb-6">
                                <AnimatePresence>
                                    {docs.length === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400">
                                            <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                                            <p className="text-lg font-semibold">知识网络空阔无物，立即开始填充！</p>
                                        </motion.div>
                                    ) : (
                                        docs.map((doc, i) => (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="glass-panel p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-500/50 transition-colors group flex flex-col"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500 mb-4 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate mb-1" title={doc.filename}>{doc.filename}</h4>
                                                <div className="flex items-center justify-between text-xs font-semibold mt-auto pt-4 text-slate-400">
                                                    <span>{formatSize(doc.file_size)}</span>
                                                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">已挂载</span>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <LibraryIcon className="w-20 h-20 mb-6 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-2xl font-bold text-slate-500">挑选或建立专属知识库起步</h3>
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
}

// Just an alias for quick SVG if lucide imports fail to destruct
function LibraryIcon({ className }: { className?: string }) {
    return <BookOpen className={className} />;
}
