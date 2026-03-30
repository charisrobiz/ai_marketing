import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET: 라이브 이벤트 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const limit = parseInt(searchParams.get('limit') || '200');

  let events;
  if (campaignId) {
    events = db.prepare(
      'SELECT * FROM live_events WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(campaignId, limit);
  } else {
    events = db.prepare(
      'SELECT * FROM live_events ORDER BY created_at DESC LIMIT ?'
    ).all(limit);
  }

  return NextResponse.json(
    (events as Array<Record<string, unknown>>).map((e) => ({
      id: e.id,
      campaignId: e.campaign_id,
      agentId: e.agent_id,
      agentName: e.agent_name,
      type: e.type,
      content: e.content,
      metadata: e.metadata ? JSON.parse(e.metadata as string) : undefined,
      timestamp: e.created_at,
    }))
  );
}

// POST: 라이브 이벤트 추가
export async function POST(request: Request) {
  const body = await request.json();
  const { id, campaignId, agentId, agentName, type, content, metadata } = body;

  db.prepare(`
    INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, campaignId || null, agentId, agentName, type, content, metadata ? JSON.stringify(metadata) : null);

  return NextResponse.json({ id, status: 'created' });
}
