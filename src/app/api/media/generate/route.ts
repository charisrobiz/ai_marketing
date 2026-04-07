import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { generateImage } from '@/lib/media/imageGenerator';
import { generateVideo, generateVideoFromText } from '@/lib/media/videoGenerator';

async function getSettings() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  for (const r of rows || []) map[r.key] = r.value;
  return map;
}

// POST: 이미지/동영상 생성
export async function POST(request: Request) {
  const body = await request.json();
  const { type, prompt, campaignId, creativeId, imageUrl } = body;
  // type: 'image' | 'video'

  const settings = await getSettings();

  if (type === 'image') {
    if (!settings.geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 등록되지 않았습니다. 관리자 설정에서 등록해주세요.' }, { status: 400 });
    }

    const result = await generateImage(settings.geminiApiKey, prompt);
    if (!result) {
      return NextResponse.json({ error: '이미지 생성에 실패했습니다.' }, { status: 500 });
    }

    // Supabase Storage에 업로드
    const fileName = `${campaignId}/${creativeId}-image.png`;
    const buffer = Buffer.from(result.imageBase64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('campaign-media')
      .upload(fileName, buffer, { contentType: result.mimeType, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage.from('campaign-media').getPublicUrl(fileName);

    // Creative의 image_url 업데이트
    if (creativeId) {
      await supabase.from('creatives').update({ image_url: publicUrl.publicUrl }).eq('id', creativeId);
    }

    return NextResponse.json({ url: publicUrl.publicUrl, type: 'image' });
  }

  if (type === 'video') {
    if (!settings.runwayApiKey) {
      return NextResponse.json({ error: 'Runway API 키가 등록되지 않았습니다. 관리자 설정에서 등록해주세요.' }, { status: 400 });
    }

    let videoUrl: string | null;

    if (imageUrl) {
      // 이미지 → 동영상
      videoUrl = await generateVideo(settings.runwayApiKey, imageUrl, prompt);
    } else {
      // 텍스트 → 동영상
      videoUrl = await generateVideoFromText(settings.runwayApiKey, prompt);
    }

    if (!videoUrl) {
      return NextResponse.json({ error: '동영상 생성에 실패했습니다.' }, { status: 500 });
    }

    // Creative의 video_url 업데이트
    if (creativeId) {
      await supabase.from('creatives').update({ video_url: videoUrl }).eq('id', creativeId);
    }

    return NextResponse.json({ url: videoUrl, type: 'video' });
  }

  return NextResponse.json({ error: 'type must be "image" or "video"' }, { status: 400 });
}
