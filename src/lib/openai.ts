import OpenAI from 'openai';

// OpenAI 客户端单例
let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 中设置。');
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

/**
 * 使用 Whisper API 将音频转写为文本
 */
export async function transcribeAudio(file: File): Promise<{ text: string; duration: number }> {
  const openai = getOpenAIClient();

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'zh', // 中文转写
    response_format: 'verbose_json',
  });

  return {
    text: transcription.text,
    duration: transcription.duration || 0,
  };
}

/**
 * 使用 GPT-4o 进行 PM 结构化分析
 * @param transcript 访谈转写/输入文本
 * @param systemPrompt PM 分析系统提示词
 * @returns 结构化分析结果
 */
export async function analyzeTranscript(
  transcript: string,
  systemPrompt: string
): Promise<string> {
  const openai = getOpenAIClient();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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
