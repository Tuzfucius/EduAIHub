
import { create } from 'zustand';
import { KnowledgeBase, KnowledgeFile } from '../services/ragService';

export type MainTab = 'files' | 'preview' | 'outline' | 'quiz';

interface StudyState {
    currentKb: KnowledgeBase | null;
    files: KnowledgeFile[];

    // Left Panel
    isLeftPanelOpen: boolean;

    // Center Panel
    activeTab: MainTab;
    previewFile: KnowledgeFile | null; // The file being previewed

    // Right Panel
    isRightPanelOpen: boolean;
    pendingMessage: string | null;

    // Actions
    setPendingMessage: (msg: string | null) => void;
    setCurrentKb: (kb: KnowledgeBase) => void;
    setFiles: (files: KnowledgeFile[]) => void;
    setPreviewFile: (file: KnowledgeFile | null) => void;
    setActiveTab: (tab: MainTab) => void;
    toggleLeftPanel: () => void;
    toggleRightPanel: () => void;
}

export const useStudyStore = create<StudyState>((set) => ({
    currentKb: null,
    files: [],
    isLeftPanelOpen: true,
    activeTab: 'files',
    previewFile: null,
    isRightPanelOpen: true,
    pendingMessage: null,

    setPendingMessage: (msg) => set({ pendingMessage: msg }),
    setCurrentKb: (kb) => set({ currentKb: kb, activeTab: 'files', previewFile: null }),
    setFiles: (files) => set({ files }),
    setPreviewFile: (file) => set({ previewFile: file, activeTab: 'preview' }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
    toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
}));
