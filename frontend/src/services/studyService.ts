
import { ragService } from './ragService';

export interface QuizItem {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
}

export const studyService = {
    async generateOutline(kbId: number) {
        // In real impl, this might hit a specific endpoint that reads the whole graph or TOC
        // MVP: Ask RAG to summarize
        const prompt = "请基于当前知识库的内容，生成一份详细的学习大纲。请使用Markdown格式，包含主要章节、关键概念和层级结构。";
        const res = await ragService.query(kbId, prompt);
        return res.answer || "生成大纲失败";
    },

    async generateQuiz(kbId: number, topic: string = "综合测试") {
        const prompt = `请针对"${topic}"这一主题，生成3道单项选择题。
请严格按照以下JSON格式返回（不要包含其他文本）：
[
  {
    "question": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "answer": "A",
    "explanation": "解析内容"
  }
]`;
        const res = await ragService.query(kbId, prompt);

        // Try to parse JSON from Markdown code block if present
        let text = res.answer;
        const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = text.match(codeBlockRegex);
        if (match) {
            text = match[1];
        }

        try {
            return JSON.parse(text) as QuizItem[];
        } catch (e) {
            console.error("Failed to parse quiz JSON", e);
            throw new Error("生成测试题格式解析失败，请重试");
        }
    }
};
