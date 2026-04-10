import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// POST: 벤치마크 캡처 이미지 업로드
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('benchmarks')
    .upload(fileName, file, { contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: publicUrl } = supabase.storage.from('benchmarks').getPublicUrl(fileName);
  return NextResponse.json({ url: publicUrl.publicUrl });
}
