import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 에이전트 작업 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  let query = supabase.from('agent_tasks').select('*').order('created_at', { ascending: false });
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  } else {
    query = query.limit(100);
  }

  const { data: tasks } = await query;
  return NextResponse.json(tasks || []);
}

// POST: 에이전트 작업 추가
export async function POST(request: Request) {
  const body = await request.json();
  const { id, campaignId, agentId, agentName, title, description, status } = body;

  await supabase.from('agent_tasks').insert({
    id,
    campaign_id: campaignId,
    agent_id: agentId,
    agent_name: agentName,
    title,
    description: description || null,
    status: status || 'pending',
  });

  return NextResponse.json({ id, status: 'created' });
}

// PATCH: 작업 상태 업데이트
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, result } = body;

  const updates: Record<string, unknown> = { status };
  if (status === 'completed') {
    updates.result = result || null;
    updates.completed_at = new Date().toISOString();
  }

  await supabase.from('agent_tasks').update(updates).eq('id', id);
  return NextResponse.json({ id, updated: true });
}
