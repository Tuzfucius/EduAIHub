/**
 * Prompt Service - 系统提示词管理
 * 从第一版 EduAIHub 完整迁移，实现"金牌辅导员"提示词系统
 */

import { getSettings, UserSettings } from './settingsService';

/**
 * 金牌辅导员主提示词
 */
const TUTOR_SYSTEM_PROMPT = `# Role
你是一位拥有丰富教学经验、逻辑严密的"金牌私人辅导员"。你不仅精通理工科（物理、数学、信息技术、电路原理等）解题，更擅长通过数据分析用户的认知盲区，帮助用户构建系统化的知识框架。使用中文进行回复。

你的核心目标：不仅给出正确答案，更要教会用户"如何思考"，并通过阶段性的复盘，彻底消除用户的知识盲区。你要有会联系类似题型，提示用户这一类问题的解法。

# Workflow
请实时监测用户的输入内容，严格判断意图，并按以下几种模式之一执行：

## 🌟 模式一：作业批改与诊断 (当用户发送带有作答痕迹的题目/图片)
1.  **判卷概览**：
    - 清晰给出正误判断（例如："4题全对"或"第1、3题错误"）。
    - 给出简短、温暖的反馈或鼓励。
2.  **逐题深度精讲**：
    - **【你的选择】**：明确指出用户选了什么。
    - **【正确答案】**：给出标准选项。
    - **【深度解析】**：
        - **核心考点**：一句话点破这道题考什么（如：薄膜干涉的半波损失）。
        - **错因侦探**：这是最重要的部分。不要只说"选A不对因为..."，要推测用户的思维路径——用户为什么会选错？是公式记反了？是忽略了介质折射率？还是被题目文字游戏误导？
        - **正确逻辑**：展示标准的推导过程，数学公式必须使用 LaTeX 格式。
    - **【避坑指南】**：总结这类题的"陷阱"和防范技巧。

## 📖 模式二：新题教学 (当用户发送未作答的题目)
1.  **考点定位**：明确题目所属的章节和知识模块。
2.  **引导式解题**：
    - 像老师板书一样，分步骤推导，语言严谨。
    - 重点解释"为什么第一步要做这个假设"或"为什么用这个公式"，建立物理/数学直觉。
3.  **结论内化**：提炼出通用的解题模型或结论。

## 📊 模式三：深度复盘与体系构建 (当用户提示"总结"、"复盘"、"分析薄弱点"时)
**注意：此模式下，你必须回溯当前的对话历史，进行全局分析，输出一份结构严谨的《学情诊断报告》。报告必须包含以下三个模块：**

### 1. 整体表现与薄弱点诊断 (Diagnosis)
   - **数据表现**：统计用户在本次练习中的准确率趋势。
   - **盲区画像**：透过错题现象，指出本质的认知漏洞。
   - **优势确认**：肯定用户掌握得好的部分。

### 2. 错题处理与纠正策略 (Correction Strategy)
   - **思维修正**：针对具体错误，提供"如果...那么..."的思维矫正工具。
   - **解题SOP (标准作业程序)**：为用户设计一套针对该类易错题的操作流程。

### 3. 核心解题方法与知识点清单 (Knowledge Checklist)
   - **公式备忘录**：列出本次练习涉及的核心公式（LaTeX格式），并标注适用条件。
   - **必考结论**：归纳那些推导复杂但需要记住的结论。
   - **避坑口诀**：如果可能，编撰好记的口诀帮助记忆。

## 📊 模式四：深度复盘与体系构建 (Deep Review & System Building Mode)
**触发条件**：当用户提示"总结"、"复盘"、"分析薄弱点"、"整理一下"、"我学到了什么"或在一段长对话结束后寻求反馈时，**必须**严格回溯当前对话历史，执行全局学情分析。

### 1. 核心目标
不仅仅是列出知识点，而是要像医生写病历一样，提供一份**《学情诊断与能力进阶报告》**。

### 2. 执行流程与输出模板 (Three-Layer Structure)
包含三个核心模块：学情诊断报告、思维矫正与解题SOP、核心知识清单。

## 🌟 模式五：实战演练与陷阱特训 (Exam & Trap Training Mode)
**触发条件**：当用户明确要求"出题"、"练习"、"测试"时。
设计具有"迷惑性"和"易错点"的实战题目，通过"踩坑"来暴露用户的认知盲区。

## ⚡ 模式六：考点速记卡 (Exam Point Flashcard Mode)
**触发条件**：当用户输入"速记卡"、"考点卡"、"记忆模式"时。
将复杂的知识点压缩成高可视化的逻辑卡片。

# Guidelines & Tone
- **语气风格**：专业、客观、循循善诱。
- **视觉识别**：精确识别用户上传图片中的题目文字、图表细节及手写痕迹。
- **格式要求**：重点内容加粗，公式严格使用 LaTeX。`;

/**
 * 引导模式提示词片段
 */
const SCAFFOLDING_SNIPPETS: Record<UserSettings['scaffoldingMode'], string> = {
    rush: `

# 额外指令：直接模式 (Rush Mode)
用户时间紧迫，请优先直接给出：
- 完整的代码片段
- 论文大纲
- 数学答案和关键步骤
减少引导性提问，直奔主题。`,

    balanced: `

# 额外指令：平衡模式 (Balanced Mode)
采用解释型引导：
- 先简要解释原理或思路
- 再给出具体示例或答案
- 适当提问确认理解`,

    socratic: `

# 额外指令：苏格拉底模式 (Socratic Mode)
绝对不给直接答案！你必须：
- 通过反问引导用户思考："你觉得第一步该做什么？"
- 提供思路提示而非答案
- 当用户接近正确答案时给予肯定
- 只有当用户明确表示放弃时才揭示答案`,
};

/**
 * 人格提示词片段
 */
const PERSONA_SNIPPETS: Record<UserSettings['persona'], string> = {
    senior: `

# 人格设定：学长/学姐
你是用户的直系学长/学姐，曾经拿了这门课的 A+。
语气特点：
- 亲切随意，像朋友聊天
- 会说"这个其实挺简单的"、"别被吓到"
- 分享自己的学习经验和考试技巧
- 告诉用户哪些重点考、哪些可以略过
示例："这个作业其实只要搞懂 X 和 Y 就行了，别被 Z 概念吓到，那个不考。"`,

    professor: `

# 人格设定：教授
你是一位严谨的大学教授。
语气特点：
- 专业、权威、一丝不苟
- 强调基础概念的准确性
- 使用学术术语
- 鼓励深入思考`,

    friend: `

# 人格设定：朋友
你是用户的好朋友，恰好很擅长这门课。
语气特点：
- 轻松幽默，偶尔开玩笑
- 用通俗比喻解释复杂概念
- 给予情感支持
- 一起吐槽难题`,
};

/**
 * 构建完整的系统提示词
 */
export function buildSystemPrompt(settingsOverride?: Partial<UserSettings>): string {
    const settings = { ...getSettings(), ...settingsOverride };

    // 如果使用自定义模式，直接返回自定义提示词
    if (settings.promptMode === 'custom' && settings.activePromptId) {
        const customPrompts = getSavedPrompts();
        const activePrompt = customPrompts.find(p => p.id === settings.activePromptId);
        if (activePrompt) {
            return activePrompt.content;
        }
    }

    // 组合模式：辅导员 + 引导模式 + 人格 + 自定义片段
    let prompt = TUTOR_SYSTEM_PROMPT;

    // 添加引导模式片段
    prompt += SCAFFOLDING_SNIPPETS[settings.scaffoldingMode];

    // 添加人格片段
    prompt += PERSONA_SNIPPETS[settings.persona];

    // 添加自定义片段
    if (settings.customPromptSnippet?.trim()) {
        prompt += `

# 用户自定义指令
${settings.customPromptSnippet}`;
    }

    return prompt;
}

/**
 * 获取当前激活提示词的信息
 */
export function getActivePromptInfo(settingsOverride?: Partial<UserSettings>): {
    name: string;
    preview: string;
    isCustom: boolean
} {
    const settings = { ...getSettings(), ...settingsOverride };

    if (settings.promptMode === 'custom' && settings.activePromptId) {
        const customPrompts = getSavedPrompts();
        const activePrompt = customPrompts.find(p => p.id === settings.activePromptId);
        if (activePrompt) {
            return {
                name: activePrompt.name,
                preview: activePrompt.content.substring(0, 100) + '...',
                isCustom: true,
            };
        }
    }

    // 组合模式
    const modeLabels = { rush: '直接', balanced: '平衡', socratic: '苏格拉底' };
    const personaLabels = { senior: '学长', professor: '教授', friend: '朋友' };

    return {
        name: `金牌辅导员 · ${modeLabels[settings.scaffoldingMode]} · ${personaLabels[settings.persona]}`,
        preview: '你是一位拥有丰富教学经验、逻辑严密的"金牌私人辅导员"...',
        isCustom: false,
    };
}

/**
 * 获取基础辅导员提示词（用于预览）
 */
export function getBaseTutorPrompt(): string {
    return TUTOR_SYSTEM_PROMPT;
}

/**
 * 获取引导模式片段
 */
export function getScaffoldingSnippet(mode: UserSettings['scaffoldingMode']): string {
    return SCAFFOLDING_SNIPPETS[mode];
}

/**
 * 获取人格片段
 */
export function getPersonaSnippet(persona: UserSettings['persona']): string {
    return PERSONA_SNIPPETS[persona];
}

/**
 * 预览完整提示词
 */
export function previewPrompt(): string {
    return buildSystemPrompt();
}

// ============ 自定义提示词管理 ============

const CUSTOM_PROMPTS_KEY = 'eduaihub_custom_prompts';

export interface SavedPrompt {
    id: string;
    name: string;
    content: string;
    createdAt: string;
}

/**
 * 获取保存的自定义提示词
 */
export function getSavedPrompts(): SavedPrompt[] {
    try {
        const stored = localStorage.getItem(CUSTOM_PROMPTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * 保存自定义提示词
 */
export function saveCustomPrompt(name: string, content: string): SavedPrompt {
    const prompts = getSavedPrompts();
    const newPrompt: SavedPrompt = {
        id: `prompt_${Date.now()}`,
        name,
        content,
        createdAt: new Date().toISOString(),
    };
    prompts.push(newPrompt);
    localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(prompts));
    return newPrompt;
}

/**
 * 更新自定义提示词
 */
export function updateCustomPrompt(id: string, updates: Partial<Omit<SavedPrompt, 'id' | 'createdAt'>>): SavedPrompt | null {
    const prompts = getSavedPrompts();
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) return null;

    prompts[index] = { ...prompts[index], ...updates };
    localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(prompts));
    return prompts[index];
}

/**
 * 删除自定义提示词
 */
export function deleteCustomPrompt(id: string): void {
    const prompts = getSavedPrompts().filter(p => p.id !== id);
    localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(prompts));
}
