import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET: 캠페인 상세 (플랜, 크리에이티브, 투표 포함)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!campaign) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const plans = db.prepare('SELECT * FROM daily_plans WHERE campaign_id = ? ORDER BY day').all(id);
  const creatives = db.prepare('SELECT * FROM creatives WHERE campaign_id = ?').all(id);

  // Aggregate votes by creative
  const voteRows = db.prepare('SELECT * FROM votes WHERE campaign_id = ?').all(id) as Array<Record<string, unknown>>;
  const votesByCreative: Record<string, Array<Record<string, unknown>>> = {};
  for (const v of voteRows) {
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

  const tasks = db.prepare('SELECT * FROM agent_tasks WHERE campaign_id = ? ORDER BY created_at').all(id);

  return NextResponse.json({
    id: campaign.id,
    productInfo: JSON.parse(campaign.product_info as string),
    status: campaign.status,
    createdAt: campaign.created_at,
    dailyPlan: (plans as Array<Record<string, unknown>>).map((p) => ({
      day: p.day,
      week: p.week,
      title: p.title,
      description: p.description,
      channels: JSON.parse((p.channels as string) || '[]'),
      target: p.target,
      goal: p.goal,
      status: p.status,
    })),
    creatives: (creatives as Array<Record<string, unknown>>).map((c) => ({
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
    db.prepare('UPDATE campaigns SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(body.status, id);
  }

  return NextResponse.json({ id, updated: true });
}
