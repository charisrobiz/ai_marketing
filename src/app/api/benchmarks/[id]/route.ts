import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { analyzeMultipleImages } from '@/lib/benchmarks/visionAnalyzer';

// GET: 단일 벤치마크 조회
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from('benchmark_items').select('*').eq('id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH: 벤치마크 수정 (메모, 태그, 재분석)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { ceo_notes, category_tags, title, reanalyze } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (ceo_notes !== undefined) updates.ceo_notes = ceo_notes;
  if (category_tags !== undefined) updates.category_tags = category_tags;

  // 재분석 요청 시
  if (reanalyze) {
    const { data: existing } = await supabase.from('benchmark_items').select('*').eq('id', id).single();
    if (existing) {
      const { data: keyData } = await supabase.from('settings').select('value').eq('key', 'geminiApiKey').single();
      const geminiKey = keyData?.value || '';

      const images: string[] = existing.captured_images || [];
      if (existing.thumbnail_url && images.length === 0) images.push(existing.thumbnail_url);

      if (images.length > 0 && geminiKey) {
        const aiResult = await analyzeMultipleImages(geminiKey, images);
        if (aiResult) {
          updates.ai_analysis = aiResult.analysis;
          updates.ai_insights = aiResult.insights;
        }
      }
    }
  }

  const { error } = await supabase.from('benchmark_items').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id, updated: true });
}

// DELETE
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabase.from('benchmark_items').delete().eq('id', id);
  return NextResponse.json({ id, deleted: true });
}
