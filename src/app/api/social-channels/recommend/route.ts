import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';
import { buildChannelSetupPrompt } from '@/lib/ai/prompts';
import type { SocialPlatform } from '@/types';

async function getSettings() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  for (const r of rows || []) map[r.key] = r.value;
  return {
    openaiApiKey: map['openaiApiKey'] || '',
    claudeApiKey: map['claudeApiKey'] || '',
    geminiApiKey: map['geminiApiKey'] || '',
  };
}

// POST: AI 채널 설정 추천
export async function POST(request: Request) {
  const body = await request.json();
  const { platform, productInfo } = body as { platform: SocialPlatform; productInfo: { name: string; category: string; targetAudience: string; uniqueValue: string; description: string } };

  const settings = await getSettings();

  try {
    const prompt = buildChannelSetupPrompt(platform, productInfo);
    const response = await callLLM(settings, prompt, 'simple');
    const recommendation = parseJSONResponse(response.content);

    // DB에 저장
    const { data: existing } = await supabase.from('social_channels').select('id').eq('platform', platform).single();

    if (existing) {
      await supabase.from('social_channels').update({
        ai_recommendation: recommendation,
        status: 'ai_recommended',
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('social_channels').insert({
        id: crypto.randomUUID(),
        platform,
        ai_recommendation: recommendation,
        status: 'ai_recommended',
      });
    }

    return NextResponse.json({ recommendation, model: response.model });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI 추천 생성 실패' }, { status: 500 });
  }
}
