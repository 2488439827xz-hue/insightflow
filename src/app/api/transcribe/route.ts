import { type NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

/**
 * POST /api/transcribe
 * 上传音频文件 → Whisper 转写为中文文本
 *
 * 需要 OPENAI_API_KEY（仅用于 Whisper，DeepSeek 不提供语音转写）
 * 如果没有 OPENAI_API_KEY，请直接用「粘贴文本」方式输入访谈内容
 *
 * Body: FormData { file: File }
 * Response: { text: string, duration: number }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: '请上传音频文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4|webm|ogg)$/i)) {
      return NextResponse.json(
        { error: `不支持的文件格式: ${file.type || file.name}。支持: mp3, wav, m4a, webm, ogg` },
        { status: 400 }
      );
    }

    // 验证文件大小 (最大 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件太大 (${(file.size / 1024 / 1024).toFixed(1)}MB)。最大支持 25MB` },
        { status: 400 }
      );
    }

    console.log(`[Transcribe] 开始转写: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    const result = await transcribeAudio(file);

    console.log(`[Transcribe] 转写完成: ${result.duration}s 音频 → ${result.text.length} 字符`);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '转写失败';
    console.error('[Transcribe] 失败:', message);

    if (message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        {
          error:
            '语音转写需要 OpenAI Whisper API（DeepSeek 不提供此功能）。请切换到「粘贴文本」Tab 直接输入访谈内容，或在 .env.local 中配置 OPENAI_API_KEY。',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
