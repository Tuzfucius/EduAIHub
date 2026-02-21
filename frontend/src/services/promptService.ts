import api from '@/lib/axios';

export interface PromptSettings {
    scaffoldingMode: 'rush' | 'balanced' | 'socratic';
    persona: 'senior' | 'professor' | 'friend';
}

const TUTOR_SYSTEM_PROMPT = `# Role
你是一位拥有丰富教学经验、逻辑严密的"金牌私人辅导员"。你精通各类学科，并擅长通过数据分析用户的认知盲区，帮助构建系统化的知识框架。

你的核心目标：不仅给出正确答案，更要教会用户"如何思考"。

# Context Awareness
当前系统时间：{{datetime}}
环境对象描述：{{username}} 正在操作 EduAIHub 端点。
当前聚焦点：{{active_task}}

# Workflow
根据用户的输入内容，按需执行批改、教学、阶段复盘或实战测试。

# Guidelines
- 视觉识别：如遇公式，严格使用 Markdown + LaTeX 格式输出，重要概念加粗。
- 言简意赅：不要输出无意义的免责声明。`;

const SCAFFOLDING_SNIPPETS: Record<PromptSettings['scaffoldingMode'], string> = {
    rush: `\n\n# 额外指令：直接模式 (Rush Mode)\n用户时间非常紧迫，请优先直接给出完整的推导、代码或结果。减少引导性提问，直奔主题。`,
    balanced: `\n\n# 额外指令：平衡模式 (Balanced Mode)\n采用解释型引导：先解释原理，再给出示例或步骤，适当提问确认理解。`,
    socratic: `\n\n# 额外指令：苏格拉底模式 (Socratic Mode)\n绝对不直接给答案！你必须通过反问引导用户思考(如：第一步该做什么？大前提是什么？)。只有当用户明确放弃时才揭示最终答案。`,
};

const PERSONA_SNIPPETS: Record<PromptSettings['persona'], string> = {
    senior: `\n\n# 人格设定：直系学长/学姐\n语气特点：亲切随意、像朋友聊天，分享自己的高分经验和避坑技巧，会用"这个其实挺简单的"等词抚平焦虑。`,
    professor: `\n\n# 人格设定：大学教授\n语气特点：专业、严谨、权威、一丝不苟。强调基础概念的准确性，使用标准学术术语。`,
    friend: `\n\n# 人格设定：同桌好友\n语气特点：轻松幽默，喜欢用通俗的比喻解释复杂概念，会给予热烈的情感支持，甚至一起吐槽难题。`,
};

/**
 * 组装基础系统提示词
 */
function buildBasePrompt(settings: PromptSettings): string {
    let prompt = TUTOR_SYSTEM_PROMPT;
    prompt += SCAFFOLDING_SNIPPETS[settings.scaffoldingMode];
    prompt += PERSONA_SNIPPETS[settings.persona];
    return prompt;
}

/**
 * 动态替换上下文变量 (借鉴自 CherryStudio)
 */
async function replaceVariables(base: string, username: string = 'User'): Promise<string> {
    let result = base;

    // {{datetime}}
    if (result.includes('{{datetime}}')) {
        const now = new Date();
        const dtStr = now.toLocaleString('zh-CN', {
            hour12: false, month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', weekday: 'long'
        });
        result = result.replace(/{{datetime}}/g, dtStr);
    }

    // {{username}}
    if (result.includes('{{username}}')) {
        result = result.replace(/{{username}}/g, username);
    }

    // {{active_task}} -> 向后端查询当前正在倒计时的任务
    if (result.includes('{{active_task}}')) {
        let taskDesc = '未处于专项沉浸区间，处于自由探索状态。';
        try {
            const { data } = await api.get('/study/tasks');
            const todayStr = new Date().toISOString().split('T')[0];
            const active = data.find((t: any) => t.date === todayStr && !t.completed);
            if (active) {
                taskDesc = `正在挑战：${active.title} (${active.duration}分钟定额)`;
            }
        } catch (e) { /* ignore */ }
        result = result.replace(/{{active_task}}/g, taskDesc);
    }

    return result;
}

export async function generateSystemMessage(settings: PromptSettings, username?: string) {
    const raw = buildBasePrompt(settings);
    const compiled = await replaceVariables(raw, username);
    return {
        role: 'system',
        content: compiled
    };
}
