-- ================================================
-- Migration: Figma 배너 합성 기능 추가
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- creatives 테이블에 banner_url 컬럼 추가
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS banner_url TEXT;
