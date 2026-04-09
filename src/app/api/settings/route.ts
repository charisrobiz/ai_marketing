import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 설정 조회
export async function GET() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const settings: Record<string, unknown> = {};
  for (const r of rows || []) {
    // JSON 객체로 저장된 필드는 파싱
    if (r.key === 'modelOverrides') {
      try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = {}; }
    } else {
      settings[r.key] = r.value;
    }
  }
  return NextResponse.json(settings);
}

// POST: 설정 저장
export async function POST(request: Request) {
  const body = await request.json();

  // 객체 필드(modelOverrides)는 JSON 문자열로 변환해서 저장
  const rows: Array<{ key: string; value: string }> = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && value) {
      rows.push({ key, value });
    } else if (typeof value === 'object' && value !== null) {
      const json = JSON.stringify(value);
      if (json !== '{}' && json !== '[]') rows.push({ key, value: json });
    }
  }

  if (rows.length > 0) {
    await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  }

  return NextResponse.json({ status: 'saved' });
}
