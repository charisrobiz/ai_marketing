import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 캠페인 상세 (플랜, 크리에이티브, 투표 포함)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).single();
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: plans }, { data: creatives }, { data: voteRows }, { data: tasks }] = await Promise.all([
    supabase.from('daily_plans').select('*').eq('campaign_id', id).order('day'),
    supabase.from('creatives').select('*').eq('campaign_id', id),
    supabase.from('votes').select('*').eq('campaign_id', id),
    supabase.from('agent_tasks').select('*').eq('campaign_id', id).order('created_at'),
  ]);

  // Aggregate votes by creative
  const votesByCreative: Record<string, Array<Record<string, unknown>>> = {};
  for (const v of voteRows || []) {
    const cid = v.creative_id as string;
    if (!votesByCreative[cid]) votesByCreative[cid] = [];
    votesByCreative[cid].push(v);
  }

  const voteResults = Object.entries(votesByCreative).map(([creativeId, votes]) => {
    const totalScore = votes.reduce((sum, v) => sum + (v.score as number), 0);
    return {
      creativeId,
      totalScore,
      averageScore: totalScore / votes.length,
      votes: votes.map((v) => ({
        juryId: v.jury_id,
        creativeId: v.creative_id,
        score: v.score,
        comment: v.comment,
      })),
      rank: 0,
    };
  }).sort((a, b) => b.averageScore - a.averageScore);
  voteResults.forEach((v, i) => { v.rank = i + 1; });

  return NextResponse.json({
    id: campaign.id,
    productInfo: campaign.product_info,
    status: campaign.status,
    createdAt: campaign.created_at,
    dailyPlan: (plans || []).map((p) => ({
      day: p.day,
      week: p.week,
      title: p.title,
      description: p.description,
      channels: typeof p.channels === 'string' ? JSON.parse(p.channels) : (p.channels || []),
      target: p.target,
      goal: p.goal,
      status: p.status,
    })),
    creatives: (creatives || []).map((c) => ({
      id: c.id,
      campaignId: c.campaign_id,
      angle: c.angle,
      copyText: c.copy_text,
      hookingText: c.hooking_text,
      imagePrompt: c.image_prompt,
      imageUrl: c.image_url,
      platform: c.platform,
      createdAt: c.created_at,
    })),
    votes: voteResults,
    tasks,
  });
}

// PATCH: 캠페인 상태 업데이트
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  if (body.status) {
    await supabase.from('campaigns').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', id);
  }

  return NextResponse.json({ id, updated: true });
}

// DELETE: 캠페인 삭제 (CASCADE로 자동 삭제)
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabase.from('campaigns').delete().eq('id', id);
  return NextResponse.json({ id, deleted: true });
}
