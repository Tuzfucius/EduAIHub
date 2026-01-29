
import React, { useEffect } from 'react';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import { useStudyStore } from '@/store/useStudyStore';
import { clsx } from 'clsx';
import { ragService } from '@/services/ragService';

export default function StudyStation() {
    const { isLeftPanelOpen, isRightPanelOpen, setCurrentKb, currentKb } = useStudyStore();

    return (
        <div className="flex h-full w-full overflow-hidden relative"
            style={{ backgroundColor: 'var(--md-surface)', color: 'var(--md-on-surface)' }}>

            {/* Left Panel - Knowledge Nav */}
            <div
                className={clsx(
                    "flex-shrink-0 transition-all duration-300 ease-in-out border-r",
                    isLeftPanelOpen ? "w-64" : "w-0 overflow-hidden"
                )}
                style={{ borderColor: 'var(--md-outline-variant)' }}
            >
                <div className="w-64 h-full">
                    <LeftPanel />
                </div>
            </div>

            {/* Center Panel - The Canvas */}
            <div className="flex-1 h-full min-w-0 flex flex-col overflow-hidden relative z-0">
                <CenterPanel />
            </div>

            {/* Right Panel - The Tutor */}
            <div
                className={clsx(
                    "flex-shrink-0 transition-all duration-300 ease-in-out border-l",
                    isRightPanelOpen ? "w-[400px]" : "w-0 overflow-hidden"
                )}
                style={{ borderColor: 'var(--md-outline-variant)' }}
            >
                <div className="w-[400px] h-full">
                    <RightPanel />
                </div>
            </div>
        </div>
    );
}
