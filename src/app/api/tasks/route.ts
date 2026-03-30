import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET: 에이전트 작업 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  let tasks;
  if (campaignId) {
    tasks = db.prepare(
      'SELECT * FROM agent_tasks WHERE campaign_id = ? ORDER BY created_at DESC'
    ).all(campaignId);
  } else {
    tasks = db.prepare('SELECT * FROM agent_tasks ORDER BY created_at DESC LIMIT 100').all();
  }

  return NextResponse.json(tasks);
}

// POST: 에이전트 작업 추가
export async function POST(request: Request) {
  const body = await request.json();
  const { id, campaignId, agentId, agentName, title, description, status } = body;

  db.prepare(`
    INSERT INTO agent_tasks (id, campaign_id, agent_id, agent_name, title, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, campaignId, agentId, agentName, title, description || null, status || 'pending');

  return NextResponse.json({ id, status: 'created' });
}

// PATCH: 작업 상태 업데이트
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, result } = body;

  if (status === 'completed') {
    db.prepare(
      'UPDATE agent_tasks SET status = ?, result = ?, completed_at = datetime(\'now\') WHERE id = ?'
    ).run(status, result || null, id);
  } else {
    db.prepare('UPDATE agent_tasks SET status = ? WHERE id = ?').run(status, id);
  }

  return NextResponse.json({ id, updated: true });
}
