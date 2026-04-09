import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { notifyCampaignCreated } from '@/lib/telegram/notifications';
import { CAMPAIGN_TYPE_CONFIG } from '@/types';

// GET: 모든 캠페인 조회
export async function GET() {
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, campaign_mode, product_info, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (campaigns || []).map((c) => ({
    id: c.id,
    mode: c.campaign_mode || 'production',
    productInfo: c.product_info,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  return NextResponse.json(result);
}

// POST: 새 캠페인 생성 (기본: production)
export async function POST(request: Request) {
  const body = await request.json();
  const { id, productInfo, options, status, mode } = body;

  const { error } = await supabase.from('campaigns').insert({
    id,
    campaign_mode: mode || 'production',
    product_info: productInfo,
    options: options || { generateImage: false, generateVideo: false },
    status: status || 'planning',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Production 모드일 때만 텔레그램 알림 + 엔진 시작 승인 요청
  if ((mode || 'production') === 'production') {
    const typeKey = options?.campaignType || 'standard';
    const typeLabel = CAMPAIGN_TYPE_CONFIG[typeKey as keyof typeof CAMPAIGN_TYPE_CONFIG]?.label || '표준';
    notifyCampaignCreated(id, productInfo?.name || '제품', typeLabel).catch(() => {});

    // 미보유 소셜 채널 자동 AI 추천 (fire-and-forget)
    triggerChannelRecommendations(productInfo).catch(() => {});
  }

  return NextResponse.json({ id, status: 'created' });
}

// 미보유 채널에 대해 AI 추천 자동 트리거
async function triggerChannelRecommendations(productInfo: Record<string, unknown>) {
  if (!productInfo?.name) return;

  const ALL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'threads', 'blog', 'kakao', 'pinterest'];

  // 이미 등록되거나 추천 받은 채널 조회
  const { data: existing } = await supabase
    .from('social_channels')
    .select('platform, status')
    .in('status', ['registered', 'ai_recommended']);

  const handledPlatforms = new Set((existing || []).map((c) => c.platform));
  const missingPlatforms = ALL_PLATFORMS.filter((p) => !handledPlatforms.has(p));

  if (missingPlatforms.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-marketing-topaz-five.vercel.app';

  // 각 미보유 채널에 대해 비동기로 추천 요청
  for (const platform of missingPlatforms) {
    fetch(`${baseUrl}/api/social-channels/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, productInfo }),
    }).catch(() => {});
  }
}
