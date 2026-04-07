-- ================================================
-- Migration: 소셜 채널 관리 + AI 계정 설정 추천
-- Supabase SQL Editor에서 실행하세요
-- ================================================

CREATE TABLE IF NOT EXISTS social_channels (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'x', 'facebook', 'threads', 'blog', 'kakao', 'pinterest')),
  status TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'registered', 'ai_recommended')),
  account_id TEXT,
  account_url TEXT,
  ai_recommendation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_channels_platform ON social_channels(platform);

-- RLS
ALTER TABLE social_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON social_channels FOR ALL USING (true) WITH CHECK (true);
