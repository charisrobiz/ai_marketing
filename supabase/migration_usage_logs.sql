-- ================================================
-- Migration: AI 토큰/비용 추적 로그
-- Supabase SQL Editor에서 실행하세요
-- ================================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  phase TEXT NOT NULL,
  task_description TEXT,

  -- LLM 사용
  provider TEXT,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  -- 미디어 생성
  media_type TEXT,
  media_count INTEGER DEFAULT 0,

  -- 비용 (USD)
  cost_usd NUMERIC(12, 8) NOT NULL DEFAULT 0,

  -- 모드 분리 (demo 캠페인 비용 별도 집계) - mode는 예약어라 campaign_mode 사용
  campaign_mode TEXT NOT NULL DEFAULT 'production',

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_campaign ON ai_usage_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_usage_agent ON ai_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_usage_phase ON ai_usage_logs(phase);
CREATE INDEX IF NOT EXISTS idx_usage_created ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_mode ON ai_usage_logs(campaign_mode);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON ai_usage_logs FOR ALL USING (true) WITH CHECK (true);
