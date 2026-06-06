import { type NextRequest, NextResponse } from 'next/server';
import { getReport, deleteReport } from '@/lib/supabase';

/**
 * GET /api/reports/[id]
 * 获取单个报告详情
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<'/api/reports/[id]'>
) {
  try {
    const { id } = await ctx.params;
    const report = await getReport(id);

    if (!report) {
      return NextResponse.json({ error: '报告不存在' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '获取报告失败';
    console.error('[Report GET] 失败:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/reports/[id]
 * 删除报告
 */
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<'/api/reports/[id]'>
) {
  try {
    const { id } = await ctx.params;
    await deleteReport(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '删除报告失败';
    console.error('[Report DELETE] 失败:', message);

    if (message.includes('SUPABASE_SERVICE_ROLE_KEY') || message.includes('SUPABASE_URL')) {
      return NextResponse.json(
        { error: 'Supabase 未配置，无法删除报告' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
