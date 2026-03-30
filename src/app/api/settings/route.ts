import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET: 설정 조회
export async function GET() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

// POST: 설정 저장
export async function POST(request: Request) {
  const body = await request.json();

  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const saveMany = db.transaction((entries: Array<[string, string]>) => {
    for (const [key, value] of entries) {
      if (value) upsert.run(key, value);
    }
  });

  saveMany(Object.entries(body).filter(([, v]) => typeof v === 'string' && v) as Array<[string, string]>);

  return NextResponse.json({ status: 'saved' });
}
