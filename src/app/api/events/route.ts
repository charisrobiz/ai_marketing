import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 라이브 이벤트 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const limit = parseInt(searchParams.get('limit') || '200');

  let query = supabase.from('live_events').select('*').order('created_at', { ascending: false }).limit(limit);
  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data: events } = await query;

  return NextResponse.json(
    (events || []).map((e) => ({
      id: e.id,
      campaignId: e.campaign_id,
      agentId: e.agent_id,
      agentName: e.agent_name,
      type: e.type,
      content: e.content,
      metadata: e.metadata || undefined,
      timestamp: e.created_at,
    }))
  );
}

// POST: 라이브 이벤트 추가
export async function POST(request: Request) {
  const body = await request.json();
  const { id, campaignId, agentId, agentName, type, content, metadata } = body;

  await supabase.from('live_events').insert({
    id,
    campaign_id: campaignId || null,
    agent_id: agentId,
    agent_name: agentName,
    type,
    content,
    metadata: metadata || null,
  });

  return NextResponse.json({ id, status: 'created' });
}
