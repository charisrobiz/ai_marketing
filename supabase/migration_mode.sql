-- ================================================
-- Migration: 캠페인 모드 (demo / production) 분리
-- Supabase SQL Editor에서 실행하세요
-- ================================================
-- 주의: 'mode'는 PostgreSQL 예약어이므로 'campaign_mode' 사용

-- campaigns 테이블에 campaign_mode 컬럼 추가
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_mode TEXT NOT NULL DEFAULT 'production';
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_mode_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_campaign_mode_check CHECK (campaign_mode IN ('demo', 'production'));

-- 만약 이전에 'mode' 컬럼을 추가했다면 삭제
ALTER TABLE campaigns DROP COLUMN IF EXISTS mode;

-- ai_usage_logs 테이블도 동일하게
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS campaign_mode TEXT NOT NULL DEFAULT 'production';
ALTER TABLE ai_usage_logs DROP COLUMN IF EXISTS mode;
