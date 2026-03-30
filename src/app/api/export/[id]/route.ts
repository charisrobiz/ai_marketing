import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET: 캠페인 결과물 다운로드 (JSON)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!campaign) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const plans = db.prepare('SELECT * FROM daily_plans WHERE campaign_id = ? ORDER BY day').all(id);
  const creatives = db.prepare('SELECT * FROM creatives WHERE campaign_id = ?').all(id);
  const votes = db.prepare('SELECT * FROM votes WHERE campaign_id = ?').all(id);
  const events = db.prepare('SELECT * FROM live_events WHERE campaign_id = ? ORDER BY created_at').all(id);
  const tasks = db.prepare('SELECT * FROM agent_tasks WHERE campaign_id = ? ORDER BY created_at').all(id);

  const exportData = {
    campaign: {
      id: campaign.id,
      productInfo: JSON.parse(campaign.product_info as string),
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
