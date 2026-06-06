import { type NextRequest, NextResponse } from 'next/server';
import { getReports, createReport } from '@/lib/supabase';
import type { AnalysisResult } from '@/types';

/**
 * GET /api/reports
 * 获取报告列表（按创建时间倒序）
 */
export async function GET() {
  try {
    const reports = await getReports();
    return NextResponse.json(reports);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取报告列表失败';

    // 如果 Supabase 未配置，返回空列表而不是报错
    if (message.includes('SUPABASE_SERVICE_ROLE_KEY') || message.includes('SUPABASE_URL')) {
      return NextResponse.json([]);
    }

    console.error('[Reports GET] 失败:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/reports
 * 创建报告（保存分析结果）
 *
 * Body: { title, source_type, transcript, audio_url?, analysis_json }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, source_type, transcript, audio_url, analysis_json } = body;

    if (!title || !source_type || !transcript) {
      return NextResponse.json(
        { error: '缺少必填字段: title, source_type, transcript' },
        { status: 400 }
      );
    }

    const report = await createReport({
      title,
      source_type,
      transcript,
      audio_url,
    });

    // 如果已有分析结果，一起保存
    if (analysis_json) {
      const { updateReportAnalysis } = await import('@/lib/supabase');
      await updateReportAnalysis(report.id, analysis_json as AnalysisResult);
      report.analysis_json = analysis_json;
      report.status = 'completed';
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '创建报告失败';
    console.error('[Reports POST] 失败:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
