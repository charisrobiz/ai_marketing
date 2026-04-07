import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 캠페인 미디어 조회
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;

  const { data: media, error } = await supabase
    .from('campaign_media')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sort_order')
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(media || []);
}

// POST: 미디어 업로드 (파일 + 메타데이터)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const formData = await request.formData();

  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string; // 'video' | 'screenshot' | 'document' | 'description'
  const content = formData.get('content') as string | null; // 텍스트 설명용
  const sortOrder = parseInt(formData.get('sort_order') as string || '0');

  if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

  const mediaId = crypto.randomUUID();
  let fileUrl: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  // 파일이 있으면 Supabase Storage에 업로드
  if (file) {
    const ext = file.name.split('.').pop();
    const storagePath = `${campaignId}/${mediaId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('campaign-media')
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: publicUrl } = supabase.storage.from('campaign-media').getPublicUrl(storagePath);
    fileUrl = publicUrl.publicUrl;
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type;
  }

  // DB에 메타데이터 저장
  const { error } = await supabase.from('campaign_media').insert({
    id: mediaId,
    campaign_id: campaignId,
    type,
    file_url: fileUrl,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    content: content || null,
    sort_order: sortOrder,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: mediaId, fileUrl, status: 'uploaded' });
}

// DELETE: 미디어 삭제
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get('mediaId');

  if (!mediaId) return NextResponse.json({ error: 'mediaId required' }, { status: 400 });

  // Storage에서 파일 삭제
  const { data: media } = await supabase
    .from('campaign_media')
    .select('file_url')
    .eq('id', mediaId)
    .eq('campaign_id', campaignId)
    .single();

  if (media?.file_url) {
    const path = media.file_url.split('/campaign-media/').pop();
    if (path) {
      await supabase.storage.from('campaign-media').remove([path]);
    }
  }

  // DB에서 삭제
  await supabase.from('campaign_media').delete().eq('id', mediaId).eq('campaign_id', campaignId);

  return NextResponse.json({ mediaId, deleted: true });
}
