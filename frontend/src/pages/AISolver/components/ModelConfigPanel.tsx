/**
 * ModelConfigPanel - 模型参数配置面板
 * 提供 Temperature 和 Top P 的调节功能
 */
import React from 'react';
import { Sliders, HelpCircle } from 'lucide-react';

interface ModelConfigPanelProps {
    temperature: number;
    topP: number;
    onChange: (params: { temperature: number; top_p: number }) => void;
    className?: string;
}

export default function ModelConfigPanel({
    temperature,
    topP,
    onChange,
    className = ''
}: ModelConfigPanelProps) {
    return (
        <div
            className={`p-4 shape-lg border border-black/5 dark:border-white/5 ${className}`}
            style={{ backgroundColor: 'var(--md-surface-container)' }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-5 h-5" style={{ color: 'var(--md-primary)' }} />
                <h3 className="font-medium" style={{ color: 'var(--md-on-surface)' }}>
                    模型参数设置
                </h3>
            </div>

            <div className="space-y-6">
                {/* Temperature */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1">
                            <span style={{ color: 'var(--md-on-surface)' }}>随机性 (Temperature)</span>
                        </div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/5" style={{ color: 'var(--md-on-surface-variant)' }}>
                            {temperature.toFixed(1)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => onChange({ temperature: parseFloat(e.target.value), top_p: topP })}
                        className="w-full"
                        style={{ accentColor: 'var(--md-primary)' }}
                    />
                    <div className="flex justify-between text-xs opacity-70" style={{ color: 'var(--md-on-surface-variant)' }}>
                        <span>精确 (0.0)</span>
                        <span>平衡 (0.7-1.0)</span>
                        <span>创意 (2.0)</span>
                    </div>
                </div>

                {/* Top P */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1">
                            <span style={{ color: 'var(--md-on-surface)' }}>核采样 (Top P)</span>
                        </div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/5" style={{ color: 'var(--md-on-surface-variant)' }}>
                            {topP.toFixed(1)}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={topP}
                        onChange={(e) => onChange({ temperature, top_p: parseFloat(e.target.value) })}
                        className="w-full"
                        style={{ accentColor: 'var(--md-primary)' }}
                    />
                    <div className="flex justify-between text-xs opacity-70" style={{ color: 'var(--md-on-surface-variant)' }}>
                        <span>仅核心词 (0.0)</span>
                        <span>多样化 (1.0)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
