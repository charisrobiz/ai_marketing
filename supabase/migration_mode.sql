-- ================================================
-- Migration: 캠페인 모드 (demo / production) 분리
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- campaigns 테이블에 mode 컬럼 추가
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'production';
ALTER TABLE campaigns ADD CONSTRAINT campaigns_mode_check CHECK (mode IN ('demo', 'production'));

-- 기존 SNAPTALE 같은 데모 캠페인은 demo로 표시 (선택)
-- UPDATE campaigns SET mode = 'demo' WHERE product_info->>'name' = 'SNAPTALE';
