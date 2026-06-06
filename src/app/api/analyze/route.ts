import { type NextRequest, NextResponse } from 'next/server';
import { analyzeTranscript } from '@/lib/openai';
import { PM_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts';

/**
 * POST /api/analyze
 * 接收访谈文本 + 标题 → DeepSeek 结构化分析
 *
 * Body: { text: string, title: string }
 * Response: { reportId: string, analysis: AnalysisResult }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, title } = body;

    // 参数校验
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '请提供访谈文本内容' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: '请提供报告标题' },
        { status: 400 }
      );
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: '访谈文本太短（至少 50 字），请提供更完整的访谈内容' },
        { status: 400 }
      );
    }

    // 截断过长文本（保留 15000 字）
    const maxChars = 15000;
    const trimmedText = text.length > maxChars
      ? text.slice(0, maxChars) + '\n\n[注：原文过长，已截断至前 15000 字]'
      : text;

    console.log(`[Analyze] 开始分析: "${title}" (${trimmedText.length} 字符)`);

    // 调 DeepSeek 分析
    const rawJson = await analyzeTranscript(trimmedText, PM_ANALYSIS_SYSTEM_PROMPT);

    console.log(`[Analyze] AI 返回 JSON: ${rawJson.length} 字符`);

    // 解析 JSON
    let analysis;
    try {
      analysis = JSON.parse(rawJson);
    } catch {
      console.error('[Analyze] JSON 解析失败，原始返回:', rawJson.slice(0, 500));
      return NextResponse.json(
        { error: 'AI 返回了非标准格式，请重试' },
        { status: 500 }
      );
    }

    // 生成简单的 reportId
    const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    console.log(`[Analyze] 分析完成: reportId=${reportId}`);

    return NextResponse.json({ reportId, analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '分析失败';
    console.error('[Analyze] 失败:', message);

    if (message.includes('DEEPSEEK_API_KEY')) {
      return NextResponse.json(
        { error: 'DeepSeek API Key 未配置。请在 Vercel 环境变量中设置 DEEPSEEK_API_KEY。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
