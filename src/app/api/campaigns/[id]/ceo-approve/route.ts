import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// POST: CEO 승인/반려
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const body = await request.json();
  const { reviewId, action, comment } = body; // action: 'approve' | 'reject' | 'approve_all'

  if (action === 'approve_all') {
    await supabase.from('creative_reviews')
      .update({ ceo_status: 'approved', ceo_comment: comment || 'CEO 일괄 승인', ceo_reviewed_at: new Date().toISOString() })
      .eq('campaign_id', campaignId)
      .eq('status', 'approved')
      .eq('ceo_status', 'pending');

    await supabase.from('live_events').insert({
      id: crypto.randomUUID(),
      campaign_id: campaignId,
      agent_id: 'ceo',
      agent_name: '쭈니 CEO',
      type: 'system',
      content: `👑 본부장 승인 소재 전체 최종 승인 완료! 광고 집행을 시작합니다.`,
    });

    return NextResponse.json({ status: 'all_approved' });
  }

  if (!reviewId) return NextResponse.json({ error: 'reviewId required' }, { status: 400 });

  const ceoStatus = action === 'approve' ? 'approved' : 'rejected';

  await supabase.from('creative_reviews')
    .update({ ceo_status: ceoStatus, ceo_comment: comment || null, ceo_reviewed_at: new Date().toISOString() })
    .eq('id', reviewId);

  // Get creative info for event
  const { data: review } = await supabase
    .from('creative_reviews')
    .select('*, creatives(angle, platform)')
    .eq('id', reviewId)
    .single();

  if (review) {
    const creative = review.creatives as Record<string, unknown> | null;
    const emoji = action === 'approve' ? '👑✅' : '👑❌';
    await supabase.from('live_events').insert({
      id: crypto.randomUUID(),
      campaign_id: campaignId,
      agent_id: 'ceo',
      agent_name: '쭈니 CEO',
      type: 'system',
      content: `${emoji} "${creative?.angle}" (${creative?.platform}) ${action === 'approve' ? 'CEO 최종 승인' : 'CEO 반려'}${comment ? ` - ${comment}` : ''}`,
    });
  }

  return NextResponse.json({ reviewId, status: ceoStatus });
}
