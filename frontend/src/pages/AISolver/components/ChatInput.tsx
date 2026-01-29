/**
 * ChatInput - 聊天输入框组件
 */
import React, { useRef, useEffect, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Send, StopCircle, Sparkles, Paperclip, X, FileText } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import imageCompression from 'browser-image-compression';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: (images?: string[], files?: File[]) => void;
    onStop: () => void;
    isLoading: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export default function ChatInput({
    value,
    onChange,
    onSend,
    onStop,
    isLoading,
    disabled = false,
    placeholder = '输入问题，按 Enter 发送...',
}: ChatInputProps) {
    const { getGradientStyle } = useTheme();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 附件列表
    const [images, setImages] = useState<string[]>([]); // Base64 images
    const [files, setFiles] = useState<File[]>([]); // Document files

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
        // ... (same as before)
        const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
        };
        try {
            setIsCompressing(true);
            const compressedFile = await imageCompression(file, options);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(compressedFile);
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
            });
        } catch (error) {
            console.error('Image compression failed:', error);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
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
        <div
            className="p-4"
            style={{
                backgroundColor: 'var(--md-surface-container-low)',
                borderTop: '1px solid var(--md-outline-variant)',
            }}
        >
            {/* 附件预览区 */}
            {(images.length > 0 || files.length > 0) && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {/* Images */}
                    {images.map((img, index) => (
                        <div key={`img-${index}`} className="relative group shrink-0">
                            <img
                                src={img}
                                alt="preview"
                                className="h-16 w-16 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute -top-1 -right-1 bg-gray-500 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {/* Files */}
                    {files.map((file, index) => (
                        <div key={`file-${index}`} className="relative group shrink-0 w-40 h-16 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-500">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)}KB</p>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-1 -right-1 bg-gray-500 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {isCompressing && (
                        <div className="h-16 w-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse">
                            <span className="text-xs text-gray-400">处理中...</span>
                        </div>
                    )}
                </div>
            )}

            <div
                className="flex items-end gap-2 p-3 shape-xl elevation-1"
                style={{ backgroundColor: 'var(--md-surface)' }}
            >
                {/* 附件按钮 */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || disabled || isCompressing}
                    className="w-10 h-10 shape-full flex items-center justify-center shrink-0 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
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

                {/* 输入框 */}
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

                {/* 发送/停止按钮 */}
                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="w-10 h-10 shape-full flex items-center justify-center shrink-0 transition-all hover:scale-105"
                        style={{
                            backgroundColor: 'var(--md-error)',
                            color: 'var(--md-on-error)',
                        }}
                        title="停止生成"
                    >
                        <StopCircle className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="w-10 h-10 shape-full flex items-center justify-center shrink-0 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        style={canSend ? getGradientStyle() : { backgroundColor: 'var(--md-surface-container-highest)' }}
                        title="发送消息 (Enter)"
                    >
                        <Send className="w-5 h-5 text-white" style={!canSend ? { color: 'var(--md-on-surface-variant)' } : undefined} />
                    </button>
                )}
            </div>

            {/* 提示文字 */}
            <div
                className="flex items-center justify-center gap-2 mt-2 text-xs"
                style={{ color: 'var(--md-on-surface-variant)' }}
            >
                <Sparkles className="w-3 h-3" />
                <span>支持文档自动分类 • Shift+Enter 换行</span>
            </div>
        </div>
    );
}
