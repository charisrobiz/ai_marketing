// 이미지 생성 - 여러 모델 지원
// Gemini Nano Banana 2 / Imagen 4 Ultra / Flux 1.1 Pro Ultra / Midjourney

export type ImageModel =
  | 'gemini-2.5-flash-image'      // Gemini Nano Banana 2 (기본, 저렴)
  | 'imagen-4-ultra'              // Google Imagen 4 Ultra (사실적, 고품질)
  | 'flux-1.1-pro-ultra'          // Flux 1.1 Pro Ultra (최고 품질, 한국인)
  | 'flux-kontext-max';           // Flux Kontext (이미지 편집/합성)

export interface ImageGenerationResult {
  imageBase64?: string;
  imageUrl?: string;
  mimeType: string;
  model: string;
}

export interface ImageGenerationOptions {
  model?: ImageModel;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:5' | '2:3';
  referenceImageUrls?: string[];  // 스타일 참고 또는 제품 이미지 (Flux Kontext)
}

// === Gemini Nano Banana 2 (기본, 기존 코드) ===
async function generateWithGemini(
  geminiApiKey: string,
  prompt: string,
): Promise<ImageGenerationResult | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
      if (part.inlineData) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
          model: 'gemini-2.5-flash-image',
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// === Google Imagen 4 Ultra (Vertex AI / AI Studio) ===
async function generateWithImagen4(
  geminiApiKey: string,
  prompt: string,
  aspectRatio: string = '1:1'
): Promise<ImageGenerationResult | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-preview-06-06:predict?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            safetyFilterLevel: 'block_only_high',
            personGeneration: 'allow_adult',
          },
        }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const prediction = data?.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) return null;

    return {
      imageBase64: prediction.bytesBase64Encoded,
      mimeType: prediction.mimeType || 'image/png',
      model: 'imagen-4-ultra',
    };
  } catch {
    return null;
  }
}

// === Flux 1.1 Pro Ultra (fal.ai) ===
async function generateWithFlux(
  falApiKey: string,
  prompt: string,
  aspectRatio: string = '1:1',
  referenceImageUrls?: string[]
): Promise<ImageGenerationResult | null> {
  try {
    const endpoint = referenceImageUrls && referenceImageUrls.length > 0
      ? 'https://fal.run/fal-ai/flux-pro/kontext/max'  // 이미지 편집/합성
      : 'https://fal.run/fal-ai/flux-pro/v1.1-ultra';   // 일반 생성

    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      num_images: 1,
      enable_safety_checker: false,
      output_format: 'png',
    };

    if (referenceImageUrls && referenceImageUrls.length > 0) {
      body.image_url = referenceImageUrls[0];
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const imageUrl = data?.images?.[0]?.url;
    if (!imageUrl) return null;

    return {
      imageUrl,
      mimeType: 'image/png',
      model: referenceImageUrls ? 'flux-kontext-max' : 'flux-1.1-pro-ultra',
    };
  } catch {
    return null;
  }
}

// === 통합 인터페이스 (기존 호환) ===
export async function generateImage(
  geminiApiKey: string,
  prompt: string,
): Promise<{ imageBase64: string; mimeType: string } | null> {
  const result = await generateWithGemini(geminiApiKey, prompt);
  if (result?.imageBase64) {
    return { imageBase64: result.imageBase64, mimeType: result.mimeType };
  }
  return null;
}

// === 새 통합 인터페이스 (모델 선택 가능) ===
export async function generateImageAdvanced(
  settings: {
    geminiApiKey?: string;
    falApiKey?: string;
  },
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult | null> {
  const model = options.model || 'gemini-2.5-flash-image';
  const aspectRatio = options.aspectRatio || '1:1';

  switch (model) {
    case 'imagen-4-ultra':
      if (!settings.geminiApiKey) return null;
      return generateWithImagen4(settings.geminiApiKey, prompt, aspectRatio);

    case 'flux-1.1-pro-ultra':
    case 'flux-kontext-max':
      if (!settings.falApiKey) {
        // fallback to Gemini
        if (settings.geminiApiKey) return generateWithGemini(settings.geminiApiKey, prompt);
        return null;
      }
      return generateWithFlux(settings.falApiKey, prompt, aspectRatio, options.referenceImageUrls);

    case 'gemini-2.5-flash-image':
    default:
      if (!settings.geminiApiKey) return null;
      return generateWithGemini(settings.geminiApiKey, prompt);
  }
}
