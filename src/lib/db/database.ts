import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'autogrowth.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// === Initialize Tables ===
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    product_info TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL,
    day INTEGER NOT NULL,
    week INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    channels TEXT,
    target TEXT,
    goal TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  CREATE TABLE IF NOT EXISTS creatives (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    angle TEXT NOT NULL,
    copy_text TEXT NOT NULL,
    hooking_text TEXT NOT NULL,
    image_prompt TEXT,
    image_url TEXT,
    platform TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL,
    creative_id TEXT NOT NULL,
    jury_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (creative_id) REFERENCES creatives(id)
  );

  CREATE TABLE IF NOT EXISTS live_events (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_tasks (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    result TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS creative_reviews (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    creative_id TEXT NOT NULL,
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
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at TEXT,
    ceo_reviewed_at TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (creative_id) REFERENCES creatives(id)
  );

  CREATE TABLE IF NOT EXISTS revision_history (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    creative_id TEXT NOT NULL,
    revision_number INTEGER NOT NULL DEFAULT 1,
    original_hook TEXT,
    original_copy TEXT,
    revised_hook TEXT,
    revised_copy TEXT,
    revised_by TEXT NOT NULL,
    revised_by_name TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (review_id) REFERENCES creative_reviews(id),
    FOREIGN KEY (creative_id) REFERENCES creatives(id)
  );
`);

export default db;
