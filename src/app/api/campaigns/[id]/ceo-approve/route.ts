import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// POST: CEO 승인/반려
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const body = await request.json();
  const { reviewId, action, comment } = body; // action: 'approve' | 'reject' | 'approve_all'

  if (action === 'approve_all') {
    db.prepare(`
      UPDATE creative_reviews SET ceo_status = 'approved', ceo_comment = ?, ceo_reviewed_at = datetime('now')
      WHERE campaign_id = ? AND status = 'approved' AND ceo_status = 'pending'
    `).run(comment || 'CEO 일괄 승인', campaignId);

    db.prepare(`INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, created_at) VALUES (?, ?, 'ceo', '쭈니 CEO', 'system', ?, datetime('now'))`)
      .run(crypto.randomUUID(), campaignId, `👑 본부장 승인 소재 전체 최종 승인 완료! 광고 집행을 시작합니다.`);

    return NextResponse.json({ status: 'all_approved' });
  }

  if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 });

  const ceoStatus = action === 'approve' ? 'approved' : 'rejected';

  db.prepare(`
    UPDATE creative_reviews SET ceo_status = ?, ceo_comment = ?, ceo_reviewed_at = datetime('now') WHERE id = ?
  `).run(ceoStatus, comment || null, reviewId);

  // Get creative info for event
  const review = db.prepare(`
    SELECT r.*, c.angle, c.platform FROM creative_reviews r JOIN creatives c ON r.creative_id = c.id WHERE r.id = ?
  `).get(reviewId) as Record<string, unknown> | undefined;

  if (review) {
    const emoji = action === 'approve' ? '👑✅' : '👑❌';
    db.prepare(`INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, created_at) VALUES (?, ?, 'ceo', '쭈니 CEO', 'system', ?, datetime('now'))`)
      .run(crypto.randomUUID(), campaignId, `${emoji} "${review.angle}" (${review.platform}) ${action === 'approve' ? 'CEO 최종 승인' : 'CEO 반려'}${comment ? ` - ${comment}` : ''}`);
  }

  return NextResponse.json({ reviewId, status: ceoStatus });
}
