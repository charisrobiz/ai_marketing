// Figma 템플릿 + AI 카피 + AI 이미지 → 최종 배너 합성 (Gemini 활용)

import type { FigmaFrame, FigmaPlaceholder } from '@/types';

const GEMINI_MODEL = 'gemini-2.0-flash-exp';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface BannerInput {
  hookingText: string;
  copyText: string;
  ctaText?: string;
  productImageUrl?: string;
}

function buildPlaceholderInstructions(placeholders: FigmaPlaceholder[], input: BannerInput, frameWidth: number, frameHeight: number): string {
  const instructions: string[] = [];

  for (const p of placeholders) {
    const relX = Math.round((p.bounds.x / frameWidth) * 100);
    const relY = Math.round((p.bounds.y / frameHeight) * 100);
    const relW = Math.round((p.bounds.w / frameWidth) * 100);
    const relH = Math.round((p.bounds.h / frameHeight) * 100);
    const pos = `position: ${relX}%,${relY}% / size: ${relW}%x${relH}%`;

    if (p.name.includes('hooking_text')) {
      const style = p.textStyle ? `, font-weight: ${p.textStyle.fontWeight >= 700 ? 'bold' : 'normal'}, align: ${p.textStyle.textAlign}` : '';
      instructions.push(`- HOOKING TEXT area (${pos}${style}): "${input.hookingText}"`);
    } else if (p.name.includes('copy_text') || p.name.includes('sub_text')) {
      instructions.push(`- COPY TEXT area (${pos}): "${input.copyText}"`);
    } else if (p.name.includes('cta_text')) {
      instructions.push(`- CTA BUTTON area (${pos}): "${input.ctaText || '지금 시작하기'}"`);
    } else if (p.name.includes('product_image') || p.name.includes('background')) {
      instructions.push(`- IMAGE area (${pos}): Place the product/marketing image here`);
    } else if (p.name.includes('logo')) {
      instructions.push(`- LOGO area (${pos}): Keep the existing logo as-is`);
    }
  }

  return instructions.join('\n');
}

export async function composeBanner(
  geminiApiKey: string,
  frame: FigmaFrame,
  input: BannerInput
): Promise<{ imageBase64: string; mimeType: string } | null> {
  if (!frame.imageUrl) return null;

  try {
    // 1. Figma 프레임 이미지 다운로드
    const templateRes = await fetch(frame.imageUrl);
    if (!templateRes.ok) return null;
    const templateBuffer = await templateRes.arrayBuffer();
    const templateBase64 = Buffer.from(templateBuffer).toString('base64');
    const templateMime = templateRes.headers.get('content-type') || 'image/png';

    // 2. 플레이스홀더 지시사항 생성
    const placeholderInstructions = frame.placeholders.length > 0
      ? buildPlaceholderInstructions(frame.placeholders, input, frame.width, frame.height)
      : `- Place hooking text "${input.hookingText}" prominently at the top\n- Place body copy "${input.copyText}" below\n- Add CTA "${input.ctaText || '지금 시작하기'}" at the bottom`;

    // 3. Gemini 멀티모달 요청
    const parts: Array<Record<string, unknown>> = [
      {
        inlineData: {
          mimeType: templateMime,
          data: templateBase64,
        },
      },
    ];

    // 상품 이미지가 있으면 추가
    if (input.productImageUrl) {
      try {
        const prodRes = await fetch(input.productImageUrl);
        if (prodRes.ok) {
          const prodBuffer = await prodRes.arrayBuffer();
          parts.push({
            inlineData: {
              mimeType: prodRes.headers.get('content-type') || 'image/png',
              data: Buffer.from(prodBuffer).toString('base64'),
            },
          });
        }
      } catch { /* skip if product image fails */ }
    }

    parts.push({
      text: `You are a professional marketing designer. I'm giving you an ad banner template image${input.productImageUrl ? ' and a product image' : ''}.

Create a FINAL ad banner by composing the template with the following marketing content.
Maintain the exact layout, color scheme, and visual style of the template.
The output must be a ${frame.width}x${frame.height} pixel banner image ready for use.

Content to place on the banner:
${placeholderInstructions}

Rules:
- Keep the template's background, colors, and overall design intact
- Text must be clearly readable with good contrast
- Korean text should be rendered beautifully
- The result should look like a professional ad banner, not AI-generated
- Output ONLY the final composed banner image, nothing else`,
    });

    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const responseParts = data?.candidates?.[0]?.content?.parts;
    if (!responseParts) return null;

    for (const part of responseParts) {
      if (part.inlineData) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
