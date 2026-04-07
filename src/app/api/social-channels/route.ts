import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 모든 채널 조회
export async function GET() {
  const { data } = await supabase.from('social_channels').select('*').order('created_at');
  return NextResponse.json(data || []);
}

// POST: 채널 등록/업데이트
export async function POST(request: Request) {
  const body = await request.json();
  const { platform, accountId, accountUrl, status } = body;

  const { data: existing } = await supabase.from('social_channels').select('id').eq('platform', platform).single();

  if (existing) {
    await supabase.from('social_channels').update({
      account_id: accountId || null,
      account_url: accountUrl || null,
      status: status || 'registered',
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
    return NextResponse.json({ id: existing.id, updated: true });
  }

  const id = crypto.randomUUID();
  await supabase.from('social_channels').insert({
    id,
    platform,
    account_id: accountId || null,
    account_url: accountUrl || null,
    status: status || 'registered',
  });
  return NextResponse.json({ id, created: true });
}

// PATCH: AI 추천 결과 저장
export async function PATCH(request: Request) {
  const body = await request.json();
  const { platform, aiRecommendation } = body;

  const { data: existing } = await supabase.from('social_channels').select('id').eq('platform', platform).single();

  if (existing) {
    await supabase.from('social_channels').update({
      ai_recommendation: aiRecommendation,
      status: 'ai_recommended',
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
    return NextResponse.json({ id: existing.id, updated: true });
  }

  const id = crypto.randomUUID();
  await supabase.from('social_channels').insert({
    id,
    platform,
    ai_recommendation: aiRecommendation,
    status: 'ai_recommended',
  });
  return NextResponse.json({ id, created: true });
}

// DELETE: 채널 삭제
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

  await supabase.from('social_channels').delete().eq('platform', platform);
  return NextResponse.json({ platform, deleted: true });
}
