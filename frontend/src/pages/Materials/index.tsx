/**
 * Materials - 材料分类页面 (占位)
 */
import React from 'react';
import { FolderOpen, FileText } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Materials() {
    const { getGradientStyle } = useTheme();

    return (
        <div className="min-h-full p-4 md:p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
                <div
                    className="w-24 h-24 shape-xl mx-auto mb-6 flex items-center justify-center"
                    style={getGradientStyle()}
                >
                    <FolderOpen className="w-12 h-12 text-white" />
                </div>

                <h1
                    className="text-2xl font-medium mb-2"
                    style={{ color: 'var(--md-on-surface)' }}
                >
                    材料分类
                </h1>

                <p
                    className="mb-6"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                >
                    智能文件分类管理功能即将推出。我们将帮助您自动整理学习资料，提高效率。
                </p>

                <div
                    className="inline-flex items-center gap-2 px-4 py-2 shape-full"
                    style={{
                        backgroundColor: 'var(--md-secondary-container)',
                        color: 'var(--md-on-secondary-container)',
                    }}
                >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">敬请期待</span>
                </div>
            </div>
        </div>
    );
}
