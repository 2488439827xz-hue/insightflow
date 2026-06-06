import OpenAI from 'openai';

// DeepSeek 客户端单例（兼容 OpenAI SDK）
let clientInstance: OpenAI | null = null;

export function getDeepSeekClient(): OpenAI {
  if (!clientInstance) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY 未配置。请在 .env.local 中设置。');
    }
    clientInstance = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }
  return clientInstance;
}

/**
 * 使用 DeepSeek 进行 PM 结构化分析
 * DeepSeek API 完全兼容 OpenAI SDK
 *
 * @param transcript 访谈文本
 * @param systemPrompt PM 分析系统提示词
 * @returns 结构化 JSON 字符串
 */
export async function analyzeTranscript(
  transcript: string,
  systemPrompt: string
): Promise<string> {
  const client = getDeepSeekClient();

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请分析以下用户访谈内容：\n\n${transcript}` },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('AI 分析返回空内容');
  }

  return content;
}
