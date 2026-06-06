import { createClient } from '@supabase/supabase-js';
import type { Report, AnalysisResult } from '@/types';

// Supabase 客户端（客户端侧）
let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error(
        'Supabase 配置缺失。请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。'
      );
    }

    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

// 服务端 Supabase 客户端（用于 API Routes）
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase Service Role Key 未配置。请在 .env.local 中设置 SUPABASE_SERVICE_ROLE_KEY。'
    );
  }

  return createClient(url, serviceKey);
}

/**
 * 创建报告记录
 */
export async function createReport(data: {
  title: string;
  source_type: 'text' | 'audio';
  transcript: string;
  audio_url?: string;
}): Promise<Report> {
  const supabase = getSupabaseAdmin();

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      title: data.title,
      source_type: data.source_type,
      transcript: data.transcript,
      audio_url: data.audio_url || null,
      status: 'processing',
    })
    .select()
    .single();

  if (error) throw new Error(`创建报告失败: ${error.message}`);
  return report as Report;
}

/**
 * 更新报告的分析结果
 */
export async function updateReportAnalysis(
  reportId: string,
  analysis: AnalysisResult
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('reports')
    .update({
      analysis_json: analysis as unknown as Record<string, unknown>,
      status: 'completed',
    })
    .eq('id', reportId);

  if (error) throw new Error(`更新报告失败: ${error.message}`);
}

/**
 * 获取单个报告
 */
export async function getReport(reportId: string): Promise<Report | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) return null;
  return data as Report;
}

/**
 * 获取报告列表
 */
export async function getReports(): Promise<Report[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`获取报告列表失败: ${error.message}`);
  return (data || []) as Report[];
}

/**
 * 删除报告
 */
export async function deleteReport(reportId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) throw new Error(`删除报告失败: ${error.message}`);
}

/**
 * 上传音频文件到 Supabase Storage
 */
export async function uploadAudioFile(file: File, filename: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`上传音频失败: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('audio-files')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
