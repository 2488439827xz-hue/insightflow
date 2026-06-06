-- InsightFlow 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 创建报告表
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users,
  title         TEXT NOT NULL,
  source_type   TEXT NOT NULL CHECK (source_type IN ('text', 'audio')),
  transcript    TEXT,
  audio_url     TEXT,
  analysis_json JSONB,
  status        TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 3. 启用 RLS (Row Level Security)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 4. RLS 策略：用户只能访问自己的报告
CREATE POLICY "用户只能查看自己的报告"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的报告"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的报告"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的报告"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 公开访问策略（用于未登录 Demo 模式）
CREATE POLICY "公开读取已完成报告"
  ON reports FOR SELECT
  USING (status = 'completed');

-- 6. 创建存储桶（在 Supabase Dashboard > Storage 中手动创建）
-- 名称: audio-files
-- 权限: public (公开读取)
