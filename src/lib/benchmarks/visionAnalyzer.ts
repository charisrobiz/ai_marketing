// Gemini Vision으로 벤치마크 이미지 분석

import type { BenchmarkAIAnalysis } from '@/types';

const VISION_MODEL = 'gemini-2.5-flash';

const ANALYSIS_PROMPT = `당신은 광고/디자인 전문가입니다. 이 광고 이미지/스크린샷을 분석하여 마케팅 벤치마크용 인사이트를 추출하세요.

다음 항목을 JSON 형식으로 반환:

{
  "dominantColors": ["#HEXCODE1", "#HEXCODE2", "#HEXCODE3"],
  "layout": "레이아웃 설명 (예: 중앙 정렬, 텍스트 상단 배치)",
  "tone": "전체 분위기/톤 (예: 따뜻하고 친근한, 차갑고 미니멀한)",
  "designStyle": "디자인 스타일 (예: 미니멀, Toss 스타일, 시네마틱)",
  "targetAudience": "추정 타겟 (예: 20대 여성, 30대 부모)",
  "emotionalAppeal": "감정 호소 방식 (예: 공감, 긴급, 권위)",
  "ocrText": "이미지에서 보이는 모든 한글/영문 텍스트",
  "strengths": ["강점1 (예: 후킹 문구가 명확)", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2"],
  "insights": "이 광고를 우리 캠페인에 적용할 때 참고할 점 (3~4문장)"
}

JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.`;

export async function analyzeImageWithVision(
  geminiApiKey: string,
  imageUrl: string
): Promise<{ analysis: BenchmarkAIAnalysis; insights: string } | null> {
  if (!geminiApiKey) return null;

  try {
    // 이미지 다운로드 → base64 변환
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;

    const buffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';

    // Gemini Vision 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: ANALYSIS_PROMPT },
              { inlineData: { mimeType, data: base64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    return {
      analysis: {
        dominantColors: parsed.dominantColors,
        layout: parsed.layout,
        tone: parsed.tone,
        designStyle: parsed.designStyle,
        targetAudience: parsed.targetAudience,
        emotionalAppeal: parsed.emotionalAppeal,
        ocrText: parsed.ocrText,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
      },
      insights: parsed.insights || '',
    };
  } catch {
    return null;
  }
}

// 여러 이미지 분석 후 통합
export async function analyzeMultipleImages(
  geminiApiKey: string,
  imageUrls: string[]
): Promise<{ analysis: BenchmarkAIAnalysis; insights: string } | null> {
  if (imageUrls.length === 0) return null;

  // 첫 번째 이미지만 분석 (비용 절감)
  return analyzeImageWithVision(geminiApiKey, imageUrls[0]);
}
