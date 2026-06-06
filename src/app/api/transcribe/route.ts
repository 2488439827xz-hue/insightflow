import { type NextRequest, NextResponse } from 'next/server';
import { transcribeWithBaidu } from '@/lib/speech';

/**
 * POST /api/transcribe
 * 上传音频文件 → 转写为中文文本
 *
 * 默认使用百度 AI 语音识别（每天 5 万次免费）
 * 如配置了 OPENAI_API_KEY 则优先用 Whisper（中文识别略差但英文更好）
 *
 * Body: FormData { file: File }
 * Response: { text: string }
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
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/amr'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4|webm|ogg|amr)$/i)) {
      return NextResponse.json(
        { error: `不支持的文件格式。支持: mp3, wav, m4a, webm, ogg, amr` },
        { status: 400 }
      );
    }

    // 验证文件大小（最大 10MB，百度 API 限制）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件太大 (${(file.size / 1024 / 1024).toFixed(1)}MB)。最大支持 10MB` },
        { status: 400 }
      );
    }

    console.log(`[Transcribe] 开始转写: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    // 将 File 转为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // 调用百度语音识别
    const text = await transcribeWithBaidu(audioBuffer, file.name);

    console.log(`[Transcribe] 转写完成: → ${text.length} 字符`);

    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '转写失败';
    console.error('[Transcribe] 失败:', message);

    if (message.includes('BAIDU_AI_API_KEY') || message.includes('未配置')) {
      return NextResponse.json(
        {
          error:
            '语音转写未配置。需要百度 AI 的 API Key 和 Secret Key（免费，每天 5 万次）。' +
            '获取方式：https://console.bce.baidu.com/ai → 语音技术 → 短语音识别。' +
            '也可切换到「粘贴文本」Tab 直接输入访谈内容。',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
