import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 설정 조회
export async function GET() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const settings: Record<string, string> = {};
  for (const r of rows || []) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

// POST: 설정 저장
export async function POST(request: Request) {
  const body = await request.json();

  const entries = Object.entries(body).filter(([, v]) => typeof v === 'string' && v) as Array<[string, string]>;
  if (entries.length > 0) {
    const rows = entries.map(([key, value]) => ({ key, value }));
    await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  }

  return NextResponse.json({ status: 'saved' });
}
