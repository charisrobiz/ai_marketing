-- ================================================
-- Migration: 벤치마크 라이브러리
-- Supabase SQL Editor에서 실행하세요
-- ================================================

CREATE TABLE IF NOT EXISTS benchmark_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT,                          -- youtube, instagram, tiktok, facebook, x, blog
  url TEXT,
  thumbnail_url TEXT,
  captured_images JSONB,                  -- 캡처 이미지 URL 배열

  -- 자동 추출 메타데이터
  meta_title TEXT,
  meta_description TEXT,
  meta_stats JSONB,                       -- {views, likes, comments, ...}
  meta_author TEXT,

  -- AI 분석 결과
  ai_analysis JSONB,                      -- {colors, layout, tone, strengths, weaknesses, ocr_text}
  ai_insights TEXT,                       -- 텍스트 인사이트

  -- CEO 메모
  ceo_notes TEXT,
  category_tags TEXT[] DEFAULT '{}',

  -- 사용 추적
  used_in_campaigns TEXT[] DEFAULT '{}',
  use_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benchmark_platform ON benchmark_items(platform);
CREATE INDEX IF NOT EXISTS idx_benchmark_created ON benchmark_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_tags ON benchmark_items USING GIN (category_tags);

ALTER TABLE benchmark_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON benchmark_items FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for benchmark images (캡처 이미지 저장용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('benchmarks', 'benchmarks', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read benchmarks" ON storage.objects
  FOR SELECT USING (bucket_id = 'benchmarks');
CREATE POLICY "Allow upload benchmarks" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'benchmarks');
CREATE POLICY "Allow delete benchmarks" ON storage.objects
  FOR DELETE USING (bucket_id = 'benchmarks');
