import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 캠페인 결과물 다운로드 (JSON)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).single();
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: plans }, { data: creatives }, { data: votes }, { data: events }, { data: tasks }] = await Promise.all([
    supabase.from('daily_plans').select('*').eq('campaign_id', id).order('day'),
    supabase.from('creatives').select('*').eq('campaign_id', id),
    supabase.from('votes').select('*').eq('campaign_id', id),
    supabase.from('live_events').select('*').eq('campaign_id', id).order('created_at'),
    supabase.from('agent_tasks').select('*').eq('campaign_id', id).order('created_at'),
  ]);

  const exportData = {
    campaign: {
      id: campaign.id,
      productInfo: campaign.product_info,
      status: campaign.status,
      createdAt: campaign.created_at,
    },
    dailyPlans: plans,
    creatives,
    votes,
    liveEvents: events,
    agentTasks: tasks,
    exportedAt: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="campaign-${id}.json"`,
    },
  });
}
