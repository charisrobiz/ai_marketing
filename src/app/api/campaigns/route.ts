import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 모든 캠페인 조회
export async function GET() {
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id, mode, product_info, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (campaigns || []).map((c) => ({
    id: c.id,
    mode: c.mode || 'production',
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
    mode: mode || 'production',
    product_info: productInfo,
    options: options || { generateImage: false, generateVideo: false },
    status: status || 'planning',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id, status: 'created' });
}
