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
 * 语音转写
 * 注意：DeepSeek 不提供语音转写 API（Whisper 是 OpenAI 独有）
 * 如需语音转写，有两种方案：
 *   A) 设置 OPENAI_API_KEY 环境变量（仅用于 Whisper），本项目会自动切换
 *   B) 直接用文本输入（推荐，MVP 已支持）
 */
export async function transcribeAudio(file: File): Promise<{ text: string; duration: number }> {
  // 优先使用 OpenAI Whisper（如果有 OPENAI_API_KEY）
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const openai = new OpenAI({ apiKey: openaiKey });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'zh',
      response_format: 'verbose_json',
    });
    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  }

  // 没有 OpenAI Key → 提示用户用文本输入
  throw new Error(
    '语音转写需要 OpenAI Whisper API。请设置 OPENAI_API_KEY 环境变量，或直接用「粘贴文本」方式输入访谈内容。'
  );
}

/**
 * 使用 DeepSeek 进行 PM 结构化分析
 * DeepSeek API 完全兼容 OpenAI SDK，只需更改 baseURL 和 model
 *
 * @param transcript 访谈转写/输入文本
 * @param systemPrompt PM 分析系统提示词
 * @returns 结构化 JSON 分析结果
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
