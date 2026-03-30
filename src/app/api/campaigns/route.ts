import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET: 모든 캠페인 조회
export async function GET() {
  const campaigns = db.prepare(`
    SELECT id, product_info, status, created_at, updated_at FROM campaigns ORDER BY created_at DESC
  `).all();

  const result = (campaigns as Array<Record<string, unknown>>).map((c) => ({
    id: c.id,
    productInfo: JSON.parse(c.product_info as string),
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  return NextResponse.json(result);
}

// POST: 새 캠페인 생성
export async function POST(request: Request) {
  const body = await request.json();
  const { id, productInfo, status } = body;

  db.prepare(`
    INSERT INTO campaigns (id, product_info, status, created_at) VALUES (?, ?, ?, datetime('now'))
  `).run(id, JSON.stringify(productInfo), status || 'planning');

  return NextResponse.json({ id, status: 'created' });
}
