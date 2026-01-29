import { get, post } from './api';

export interface KnowledgeBase {
    id: number;
    name: string;
    description?: string;
    status: 'empty' | 'building' | 'ready' | 'failed';
    files_count: number;
    created_at: string;
}

export interface KnowledgeFile {
    id: number;
    filename: string;
    file_size: number;
    status: 'uploaded' | 'processing' | 'completed' | 'failed';
    created_at: string;
}

export interface RagReference {
    filename: string;
    content: string;
    score: number;
}

export interface RagResponse {
    answer: string;
    rejected: boolean;
    references: RagReference[];
    context?: string;
}

export const ragService = {
    async getKnowledgeBases(): Promise<KnowledgeBase[]> {
        return get<KnowledgeBase[]>('/api/rag/kb');
    },

    async createKnowledgeBase(name: string, description?: string): Promise<KnowledgeBase> {
        return post<KnowledgeBase>('/api/rag/kb', { name, description });
    },

    async getKbDetail(id: number): Promise<KnowledgeBase> {
        return get<KnowledgeBase>(`/api/rag/kb/${id}`);
    },

    async getKbFiles(id: number): Promise<KnowledgeFile[]> {
        return get<KnowledgeFile[]>(`/api/rag/kb/${id}/files`);
    },

    async uploadFile(kbId: number, file: File): Promise<KnowledgeFile> {
        const formData = new FormData();
        formData.append('file', file);

        // Use raw fetch for FormData since api.post expects JSON usually, 
        // but we can look at api.ts: request() allows body to be Init.
        // api.ts request adds Content-Type: application/json automatically which breaks FormData
        // So we must manually handle auth here using getToken from api.ts

        const { getToken, config } = await import('./api');
        // Dynamic import or just import at top? api.ts exports getToken.
        // Let's rely on the import at top.

        const token = getToken();
        const res = await fetch(`${config.apiBaseUrl}/api/rag/kb/${kbId}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Do NOT set Content-Type, let browser set boundary
            },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(err.detail || 'Failed to upload file');
        }
        return res.json();
    },

    async buildIndex(kbId: number): Promise<any> {
        return post(`/api/rag/kb/${kbId}/build`);
    },

    async uploadTempFile(file: File): Promise<{ temp_file_id: string; original_filename: string; summary: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const { getToken, config } = await import('./api');
        const token = getToken();
        // Use raw fetch for FormData
        const res = await fetch(`${config.apiBaseUrl}/api/rag/upload/temp`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) throw new Error('Temp upload failed');
        return res.json();
    },

    async autoClassify(tempFileId: string, originalFilename: string): Promise<{ kb_name: string; reason: string; status: string }> {
        return post('/api/rag/classify', { temp_file_id: tempFileId, original_filename: originalFilename });
    },

    async query(kbId: number, question: string, history: string[] = []): Promise<RagResponse> {
        return post<RagResponse>('/api/rag/query', { kb_id: kbId, question, history });
    }
};
