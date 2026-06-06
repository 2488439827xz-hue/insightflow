import { type NextRequest, NextResponse } from 'next/server';
import { createTranscribeTask, queryTranscribeTask } from '@/lib/speech';

/**
 * POST /api/transcribe
 * 上传音频文件 → 创建百度长语音识别任务 → 返回 taskId
 *
 * Body: FormData { file: File }
 * Response: { taskId: string, estimatedSeconds: number }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '请上传音频文件' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/amr'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4|webm|ogg|amr)$/i)) {
      return NextResponse.json(
        { error: `不支持的格式。支持: mp3, wav, m4a, webm, ogg, amr` },
        { status: 400 }
      );
    }

    // 最大 500MB（长语音支持大文件）
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `文件太大 (${(file.size / 1024 / 1024).toFixed(0)}MB)。最大支持 500MB` },
        { status: 400 }
      );
    }

    console.log(`[Transcribe] 创建长语音任务: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const { taskId, estimatedSeconds } = await createTranscribeTask(audioBuffer, file.name);

    console.log(`[Transcribe] 任务已创建: taskId=${taskId}, 预估 ${estimatedSeconds}s`);

    return NextResponse.json({ taskId, estimatedSeconds });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '创建转写任务失败';
    console.error('[Transcribe POST] 失败:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/transcribe?taskId=xxx
 * 轮询百度长语音识别结果
 *
 * Response: { status: "processing" | "completed" | "failed", text?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: '缺少 taskId 参数' }, { status: 400 });
    }

    const result = await queryTranscribeTask(taskId);

    if (result.status === 'completed') {
      console.log(`[Transcribe] 转写完成: ${result.text.length} 字符`);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '查询转写结果失败';
    console.error('[Transcribe GET] 失败:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
