-- ================================================
-- Migration: 이미지/동영상 생성 기능 추가
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. campaigns 테이블에 options 컬럼 추가
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '{"generateImage": false, "generateVideo": false}';

-- 2. creatives 테이블에 video_url 컬럼 추가
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS video_url TEXT;
