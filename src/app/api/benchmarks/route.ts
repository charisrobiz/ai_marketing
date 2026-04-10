import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { analyzeURL } from '@/lib/benchmarks/urlAnalyzer';
import { analyzeMultipleImages } from '@/lib/benchmarks/visionAnalyzer';

async function getGeminiKey(): Promise<string> {
  const { data } = await supabase.from('settings').select('value').eq('key', 'geminiApiKey').single();
  return data?.value || '';
}

// GET: 모든 벤치마크 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');

  let query = supabase.from('benchmark_items').select('*').order('created_at', { ascending: false });
  if (platform) query = query.eq('platform', platform);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

// POST: 새 벤치마크 생성 (URL 또는 이미지 기반)
export async function POST(request: Request) {
  const body = await request.json();
  const { title, url, captured_images, ceo_notes, category_tags, platform: manualPlatform } = body;

  const id = crypto.randomUUID();
  const geminiKey = await getGeminiKey();

  let urlMeta: Awaited<ReturnType<typeof analyzeURL>> | null = null;
  if (url) {
    try {
      urlMeta = await analyzeURL(url);
    } catch { /* ignore */ }
  }

  // AI Vision 분석 (캡처 이미지 또는 썸네일)
  let aiResult: Awaited<ReturnType<typeof analyzeMultipleImages>> = null;
  const imagesToAnalyze: string[] = [];

  if (captured_images && captured_images.length > 0) {
    imagesToAnalyze.push(...captured_images);
  } else if (urlMeta?.thumbnailUrl) {
    imagesToAnalyze.push(urlMeta.thumbnailUrl);
  }

  if (imagesToAnalyze.length > 0 && geminiKey) {
    try {
      aiResult = await analyzeMultipleImages(geminiKey, imagesToAnalyze);
    } catch { /* ignore */ }
  }

  const insertData = {
    id,
    title: title || urlMeta?.title || '제목 없음',
    platform: urlMeta?.platform || manualPlatform || 'other',
    url: url || null,
    thumbnail_url: urlMeta?.thumbnailUrl || (captured_images?.[0] || null),
    captured_images: captured_images || null,
    meta_title: urlMeta?.title || null,
    meta_description: urlMeta?.description || null,
    meta_stats: urlMeta?.stats || null,
    meta_author: urlMeta?.author || null,
    ai_analysis: aiResult?.analysis || null,
    ai_insights: aiResult?.insights || null,
    ceo_notes: ceo_notes || null,
    category_tags: category_tags || [],
  };

  const { error } = await supabase.from('benchmark_items').insert(insertData);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(insertData);
}
