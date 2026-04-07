-- ================================================
-- AI Marketing Platform - Supabase Schema
-- Supabase SQL Editor에서 이 전체를 복사하여 실행하세요
-- ================================================

-- 1. campaigns
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  product_info JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. daily_plans
CREATE TABLE daily_plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  week INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channels TEXT,
  target TEXT,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);

-- 3. creatives
CREATE TABLE creatives (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  angle TEXT NOT NULL,
  copy_text TEXT NOT NULL,
  hooking_text TEXT NOT NULL,
  image_prompt TEXT,
  image_url TEXT,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. votes
CREATE TABLE votes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creative_id TEXT NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  jury_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  comment TEXT
);

-- 5. live_events
CREATE TABLE live_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. agent_tasks
CREATE TABLE agent_tasks (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 7. settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 8. creative_reviews
CREATE TABLE creative_reviews (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creative_id TEXT NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  reviewer TEXT NOT NULL DEFAULT 'hana',
  reviewer_name TEXT NOT NULL DEFAULT '하나',
  status TEXT NOT NULL DEFAULT 'pending_review',
  score INTEGER,
  brand_consistency INTEGER,
  target_fit INTEGER,
  cost_efficiency INTEGER,
  comment TEXT,
  revision_note TEXT,
  ceo_status TEXT DEFAULT 'pending',
  ceo_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  ceo_reviewed_at TIMESTAMPTZ
);

-- 9. revision_history
CREATE TABLE revision_history (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES creative_reviews(id) ON DELETE CASCADE,
  creative_id TEXT NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL DEFAULT 1,
  original_hook TEXT,
  original_copy TEXT,
  revised_hook TEXT,
  revised_copy TEXT,
  revised_by TEXT NOT NULL,
  revised_by_name TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. campaign_media (신규 - CEO 미디어 업로드용)
CREATE TABLE campaign_media (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'screenshot', 'document', 'description')),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- Indexes
-- ================================================
CREATE INDEX idx_daily_plans_campaign ON daily_plans(campaign_id);
CREATE INDEX idx_creatives_campaign ON creatives(campaign_id);
CREATE INDEX idx_votes_campaign ON votes(campaign_id);
CREATE INDEX idx_votes_creative ON votes(creative_id);
CREATE INDEX idx_live_events_campaign ON live_events(campaign_id);
CREATE INDEX idx_agent_tasks_campaign ON agent_tasks(campaign_id);
CREATE INDEX idx_creative_reviews_campaign ON creative_reviews(campaign_id);
CREATE INDEX idx_revision_history_creative ON revision_history(creative_id);
CREATE INDEX idx_campaign_media_campaign ON campaign_media(campaign_id);

-- ================================================
-- Storage Bucket (미디어 파일용)
-- ================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: 누구나 읽기 가능
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'campaign-media');

-- Storage Policy: anon 키로 업로드 가능
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'campaign-media');

-- Storage Policy: anon 키로 삭제 가능
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'campaign-media');

-- ================================================
-- RLS (Row Level Security) - 개발 단계에서는 모두 허용
-- ================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_media ENABLE ROW LEVEL SECURITY;

-- 개발용: 모든 테이블에 anon 접근 허용
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'campaigns', 'daily_plans', 'creatives', 'votes',
    'live_events', 'agent_tasks', 'settings',
    'creative_reviews', 'revision_history', 'campaign_media'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Allow all for anon" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
