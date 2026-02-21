/**
 * ChatInput - 聊天输入框组件
 */
import React, { useRef, useEffect, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Send, StopCircle, Sparkles, Paperclip, X, FileText } from 'lucide-react';
import { useTheme, THEME_COLORS } from '@/contexts/ThemeContext';
import imageCompression from 'browser-image-compression';
import { ThemeColor } from '@/config/theme';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (images?: string[], files?: File[]) => void;
    onStop: () => void;
    isLoading: boolean;
    disabled?: boolean;
    placeholder?: string;
    themeColor?: { primary: string; light: string; dark: string };
}

export default function ChatInput({
    value,
    onChange,
    onSend,
    onStop,
    isLoading,
    disabled = false,
    placeholder = '输入问题，按 Enter 发送...',
    themeColor,
}: ChatInputProps) {
    const { isDark } = useTheme();
    const theme = themeColor || { primary: '#8B5CF6', light: '#FAF5FF', dark: '#7C3AED' };
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [images, setImages] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [isCompressing, setIsCompressing] = useState(false);

    // 自动调整高度
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 200);
            textarea.style.height = `${newHeight}px`;
        }
    }, [value]);

    // 处理图片压缩
    const compressImage = async (file: File): Promise<string> => {
        const originalSize = file.size / 1024;
        console.log(`[Image] Compressing: ${file.name} (${originalSize.toFixed(1)}KB)`);

        const options = {
            maxSizeMB: 1,  // 增加到 1MB
            maxWidthOrHeight: 1920,  // 增加到 1920px
            useWebWorker: true,
        };

        try {
            setIsCompressing(true);
            const compressedFile = await imageCompression(file, options);

            const result = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressedFile);
                reader.onloadend = () => {
                    const result = reader.result as string;
                    if (reader.error) {
                        reject(new Error(`FileReader error: ${reader.error}`));
                        return;
                    }
                    if (!result || !result.startsWith('data:image/')) {
                        reject(new Error('Invalid base64 image format'));
                        return;
                    }
                    const compressedSize = result.length / 1024;
                    console.log(`[Image] Compressed: ${file.name} → ${(compressedSize).toFixed(1)}KB`);
                    resolve(result);
                };
                reader.onerror = () => reject(new Error('FileReader failed'));
            });

            return result;
        } catch (error) {
            console.warn(`[Image] Compression failed, using original: ${error}`);

            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    const result = reader.result as string;
                    if (reader.error || !result || !result.startsWith('data:image/')) {
                        reject(new Error('Failed to read original image'));
                        return;
                    }
                    const originalResultSize = result.length / 1024;
                    console.log(`[Image] Using original: ${file.name} (${originalResultSize.toFixed(1)}KB)`);
                    resolve(result);
                };
                reader.onerror = () => reject(new Error('Failed to read original image'));
            });
        } finally {
            setIsCompressing(false);
        }
    };

    // 处理文件选择
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);

            const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
            const docFiles = selectedFiles.filter(f => !f.type.startsWith('image/'));

            // Process Images
            for (const file of imageFiles) {
                const base64 = await compressImage(file);
                setImages(prev => [...prev, base64]);
            }

            // Process Docs
            if (docFiles.length > 0) {
                setFiles(prev => [...prev, ...docFiles]);
            }

            // 重置输入框
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // 处理粘贴
    const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    const base64 = await compressImage(file);
                    setImages(prev => [...prev, base64]);
                }
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 发送
    const handleSend = () => {
        if (!isLoading && !disabled && !isCompressing && (value.trim() || images.length > 0 || files.length > 0)) {
            onSend(images, files);
            setImages([]);
            setFiles([]);
        }
    };

    // 处理键盘事件
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const canSend = (value.trim() || images.length > 0 || files.length > 0) && !isLoading && !disabled && !isCompressing;

    return (
        <div className="p-4 theme-transition">
            {(images.length > 0 || files.length > 0) && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar">
                    {images.map((img, index) => (
                        <div key={`img-${index}`} className="relative group shrink-0">
                            <img
                                src={img}
                                alt="preview"
                                className="h-16 w-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-1.5 -right-1.5 bg-slate-500 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {files.map((file, index) => (
                        <div
                            key={`file-${index}`}
                            className="relative group shrink-0 w-40 h-16 rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
                        >
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${theme.primary}15`, color: theme.primary }}>
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-slate-700 dark:text-slate-300" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)}KB</p>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-1.5 -right-1.5 bg-slate-500 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {isCompressing && (
                        <div className="h-16 w-16 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse-soft">
                            <span className="text-xs text-slate-500">处理中...</span>
                        </div>
                    )}
                </div>
            )}

            <div
                className={`
                    flex items-end gap-3 p-1 rounded-2xl shadow-lg border transition-all duration-300
                    ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}
                `}
            >
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || disabled || isCompressing}
                    className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                        ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}
                    `}
                    style={{ color: 'var(--md-on-surface-variant)' }}
                    title="上传图片或文件"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                />

                <div className="flex-1 relative py-2">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={images.length > 0 || files.length > 0 ? "描述文件内容..." : placeholder}
                        disabled={isLoading || disabled}
                        rows={1}
                        className="w-full resize-none outline-none text-base leading-relaxed bg-transparent"
                        style={{
                            color: 'var(--md-on-surface)',
                            maxHeight: '200px',
                            minHeight: '24px',
                        }}
                    />
                </div>

                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 hover-lift"
                        style={{
                            backgroundColor: '#EF4444',
                            color: 'white',
                        }}
                        title="停止生成"
                    >
                        <StopCircle className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className={`
                            w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                            hover:scale-105 hover-lift disabled:opacity-50 disabled:hover:scale-100
                            ${canSend
                                ? 'shadow-lg'
                                : ''
                            }
                        `}
                        style={{
                            background: canSend
                                ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.dark} 100%)`
                                : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }}
                        title="发送消息 (Enter)"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                )}
            </div>

            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                <Sparkles className="w-3 h-3" />
                <span>支持文档自动分类 • Shift+Enter 换行</span>
            </div>
        </div>
    );
}
