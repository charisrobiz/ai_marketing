// 정교한 photorealistic 이미지 프롬프트 빌더
// AI가 디자이너 수준의 이미지를 생성할 수 있도록 카테고리/스타일/자산 타입별 최적화된 프롬프트 생성

import type { ProductInfo, ProductCategory, DesignStyle, AssetType, BenchmarkItem } from '@/types';
import { DESIGN_STYLE_CONFIG, ASSET_TYPE_CONFIG } from '@/types';

// 벤치마크 컨텍스트 빌더
export function buildBenchmarkContext(benchmarks: BenchmarkItem[]): string {
  if (!benchmarks || benchmarks.length === 0) return '';

  const blocks = benchmarks.map((bm, i) => {
    const parts: string[] = [`Reference ${i + 1}: ${bm.title}`];
    if (bm.platform) parts.push(`Platform: ${bm.platform}`);
    if (bm.ai_analysis?.dominantColors?.length) parts.push(`Colors: ${bm.ai_analysis.dominantColors.join(', ')}`);
    if (bm.ai_analysis?.tone) parts.push(`Tone: ${bm.ai_analysis.tone}`);
    if (bm.ai_analysis?.designStyle) parts.push(`Style: ${bm.ai_analysis.designStyle}`);
    if (bm.ai_analysis?.layout) parts.push(`Layout: ${bm.ai_analysis.layout}`);
    if (bm.ai_analysis?.emotionalAppeal) parts.push(`Emotional appeal: ${bm.ai_analysis.emotionalAppeal}`);
    if (bm.ai_insights) parts.push(`Insight: ${bm.ai_insights}`);
    if (bm.ceo_notes) parts.push(`CEO notes: ${bm.ceo_notes}`);
    return parts.join('\n  ');
  });

  return `\n\n=== BENCHMARK REFERENCES (CEO selected these as inspiration) ===
The user has selected the following ${benchmarks.length} benchmark(s) for inspiration. Extract their common visual elements (color palette, mood, composition, emotional tone) and apply them to the new image:

${blocks.join('\n\n')}

IMPORTANT: Your generated image should feel inspired by these references in terms of:
- Color palette (use similar dominant colors)
- Visual mood and emotional tone
- Composition style
- Overall aesthetic
But the SUBJECT MATTER must be specific to the new product, not copied from the references.
`;
}

// 카테고리별 기본 시나리오 (한국 타겟)
const CATEGORY_SCENE_TEMPLATES: Record<ProductCategory, string[]> = {
  mobile_app: [
    'Korean person in their 20s-30s naturally using a smartphone in a bright modern apartment',
    'Young Korean woman sitting at a cafe desk with coffee, focused on her phone screen',
    'Korean family scene with parent using the app while child plays nearby',
    'Korean office worker on a commute subway using the app',
  ],
  web_service: [
    'Korean professional working on laptop in a modern co-working space',
    'Korean startup team having a meeting with laptop showing the service dashboard',
    'Korean freelancer at home office using the web service on desktop',
  ],
  physical_product: [
    'Clean studio product shot on a subtle gradient background with dramatic lighting',
    'Lifestyle shot of the product being used by a Korean person in a natural setting',
    'Korean hands holding and showcasing the product against a minimal background',
  ],
  insurance: [
    'Korean family happy together in a bright warm home environment',
    'Korean middle-aged person looking relieved and confident',
    'Korean couple making plans with documents on a kitchen table',
  ],
  education: [
    'Korean student or young adult studying intently at a desk with laptop',
    'Korean adult learner watching online lecture with notebook and coffee',
    'Bright study environment with books and modern educational materials',
  ],
  food_beverage: [
    'Top-down food photography of the product with warm natural lighting',
    'Korean person enjoying the food or drink in a cozy cafe setting',
    'Appetizing close-up shot with shallow depth of field, professional food photography',
  ],
  fashion: [
    'Korean model wearing the fashion item in a stylish urban Seoul setting',
    'Editorial fashion shot with Korean lifestyle backdrop',
    'Lookbook style with natural pose and contemporary Korean fashion aesthetic',
  ],
  other: [
    'Korean lifestyle scene that naturally incorporates the product or service',
    'Clean professional shot relevant to the product category',
  ],
};

// 카메라/렌즈 프리셋
const CAMERA_PRESETS = {
  commercial: 'Shot on Sony A7IV with Sony 35mm f/1.4 GM lens, shallow depth of field, professional commercial photography',
  editorial: 'Shot on Canon EOS R5 with 85mm f/1.2 prime lens, creamy bokeh, magazine editorial quality',
  lifestyle: 'Shot on Fuji X-T5 with 23mm f/2 lens, natural documentary style, Kodak Portra 400 film emulation',
  product: 'Shot on Hasselblad X2D with 90mm macro lens, studio perfect lighting, ultra sharp focus, tack sharp',
  cinematic: 'Shot on ARRI Alexa Mini LF with Master Prime 50mm lens, anamorphic widescreen, cinema quality',
};

// 조명 프리셋
const LIGHTING_PRESETS = {
  naturalWindow: 'Soft natural window light from the left side, warm afternoon golden glow, subtle rim light, no harsh shadows',
  goldenHour: 'Magical golden hour lighting, warm amber tones, long soft shadows, sun flare effect',
  studio: 'Professional three-point studio lighting setup, softbox key light, fill light, rim light, no harsh shadows',
  cozy: 'Warm indoor ambient light, cozy mood, soft glow from table lamps, intimate atmosphere',
  bright: 'Bright airy lighting, soft diffused daylight, clean and optimistic mood',
};

// 네거티브 프롬프트 (공통)
const NEGATIVE_PROMPT = 'no AI artifacts, no plastic skin, no warped hands, no extra fingers, no symmetrical face, no oversaturated colors, no fake smile, no cartoon style, no low resolution, no blurry text, no distorted proportions, no uncanny valley effect';

// 자산 타입별 컴포지션 가이드
const ASSET_COMPOSITION_GUIDES: Record<AssetType, string> = {
  card_news: 'Square 1:1 composition with strong central subject, ample negative space at top or bottom for Korean text overlay, clean and readable, card news style',
  shorts: 'Vertical 9:16 composition optimized for mobile viewing, main subject in upper two-thirds, space for text at bottom, eye-catching within first second',
  feed_image: 'Square 1:1 composition, rule of thirds, strong visual hook, optimized for Instagram feed scroll-stopping',
  banner: '16:9 horizontal composition, subject on left third, negative space on right for headline text, hero banner style',
  video_ad: '16:9 cinematic horizontal composition, multiple focal points for storytelling, commercial quality',
  blog_post: 'Editorial magazine-style composition, storytelling, wide shot showing context',
  story: 'Vertical 9:16 full-bleed composition, bold central subject, high contrast, swipeable story style',
};

export interface PhotographicPromptInput {
  productInfo: ProductInfo;
  angle: string;                // "감성형", "유머형" 등
  hookingText: string;
  copyText: string;
  assetType: AssetType;
  designStyle: DesignStyle;
  customReference?: string;     // CEO가 업로드한 레퍼런스 이미지 설명
  productImageUrl?: string;     // CEO 업로드 제품 이미지 (앱 화면 등)
  benchmarks?: BenchmarkItem[]; // 벤치마크 라이브러리 참고
}

// === 메인: AI 메타 프롬프트 빌더 ===
// LLM에게 "아래 정보로 최고 품질의 이미지 프롬프트를 만들어줘"라고 요청하기 위한 입력
export function buildPhotographicPromptRequest(input: PhotographicPromptInput): string {
  const { productInfo, angle, hookingText, copyText, assetType, designStyle, customReference, productImageUrl, benchmarks } = input;
  const benchmarkContext = buildBenchmarkContext(benchmarks || []);

  const styleConfig = DESIGN_STYLE_CONFIG[designStyle];
  const assetConfig = ASSET_TYPE_CONFIG[assetType];
  const composition = ASSET_COMPOSITION_GUIDES[assetType];
  const sceneTemplates = CATEGORY_SCENE_TEMPLATES[productInfo.category];

  return `You are an expert commercial photographer and AI image prompt engineer.

Your task: Create a HIGHLY DETAILED, PHOTOREALISTIC image generation prompt for a Korean marketing campaign.
The output must produce a result that looks like a professional designer/photographer made it, NOT AI-generated.

=== PRODUCT INFO ===
Name: ${productInfo.name}
Category: ${productInfo.category}
Description: ${productInfo.description || 'N/A'}
Target Audience: ${productInfo.targetAudience || 'Korean general consumers'}
Unique Value: ${productInfo.uniqueValue || 'N/A'}

=== CREATIVE DIRECTION ===
Angle: ${angle} (the emotional/strategic angle of this creative)
Hooking Text (Korean): "${hookingText}"
Body Copy (Korean): "${copyText}"

=== ASSET TYPE: ${assetConfig.label} ===
${assetConfig.description}
Dimensions: ${assetConfig.dimensions}
Aspect Ratio: ${assetConfig.aspectRatio}
Composition Guide: ${composition}

=== DESIGN STYLE: ${styleConfig.label} ===
${styleConfig.description}
Style guidance: ${styleConfig.promptSnippet}

${customReference ? `=== CEO REFERENCE ===\n${customReference}\n` : ''}
${productImageUrl ? `=== PRODUCT IMAGE AVAILABLE ===\nThere is an actual product/app screenshot that should be integrated naturally into the scene (e.g., shown on a phone screen, in someone's hand, on a desk).\n` : ''}
${benchmarkContext}

=== SCENE SUGGESTIONS (pick the most appropriate or invent better) ===
${sceneTemplates.map((s, i) => `${i + 1}. ${s}`).join('\n')}

=== REQUIREMENTS ===
The generated prompt MUST include ALL of the following sections in this exact order:

1. SUBJECT: Specific description of who/what is in the image (for people: age, Korean ethnicity, clothing, expression, pose, genuine emotion matching the angle)
2. ENVIRONMENT: Specific Korean setting (apartment, cafe, street, office, etc.) with realistic details (plants, furniture, lighting sources, props)
3. TECHNICAL: Camera, lens, aperture, focal length (use: ${Object.values(CAMERA_PRESETS).join(' OR ')})
4. LIGHTING: Specific lighting setup with direction, color temperature, mood (use: ${Object.values(LIGHTING_PRESETS).join(' OR ')})
5. COMPOSITION: Exact framing (${composition})
6. STYLE: ${styleConfig.promptSnippet}
7. POST-PROCESSING: Film emulation, color grading, resolution (e.g., "Kodak Portra 400 film grade, slight warm tones, sharp focus, 8K resolution, magazine quality")
8. NEGATIVE: ${NEGATIVE_PROMPT}

=== OUTPUT FORMAT ===
Respond with ONLY the final image prompt as a single continuous paragraph in ENGLISH (the image model understands English best).
Do NOT include section headers in the output.
Do NOT include any explanations.
Make the prompt EXTREMELY specific and detailed (200-400 words).
Avoid generic terms like "beautiful" or "amazing".
Use concrete, visual, sensory language.
The prompt must be optimized for Gemini Imagen / Flux / Midjourney.

Generate the prompt now:`;
}

// === 카드뉴스 전용: 10장 슬라이드 구성 프롬프트 ===
export function buildCardNewsSlidesPrompt(
  productInfo: ProductInfo,
  angle: string,
  hookingText: string,
  copyText: string,
  designStyle: DesignStyle
): string {
  const styleConfig = DESIGN_STYLE_CONFIG[designStyle];

  return `You are a Korean marketing content strategist designing a 10-slide card news (인스타 캐러셀) for ${productInfo.name}.

=== PRODUCT ===
${productInfo.name} - ${productInfo.description}
Target: ${productInfo.targetAudience}
Angle: ${angle}

=== STYLE ===
${styleConfig.label}: ${styleConfig.description}

=== TASK ===
Create 10 slides following this structure:
- Slide 1: Hook (후킹) - "${hookingText}" - grab attention in 2 seconds
- Slide 2: Problem (문제 제기) - relate to target's pain point
- Slide 3-4: Story/Context (상황 설명)
- Slide 5-6: Solution introduction (해결책)
- Slide 7-8: Benefits/Features (혜택/기능)
- Slide 9: Social proof or urgency (신뢰/긴급성)
- Slide 10: CTA (Call to Action)

For each slide, provide:
1. headline: Short catchy Korean text (under 20 characters)
2. subtext: Supporting Korean text (30-80 characters)
3. imagePrompt: ENGLISH photorealistic image prompt (200+ words, include subject/environment/technical/lighting/composition/style/post-processing/negative as described)

The image prompts MUST be Korean-themed (Korean people, Korean environment) and follow ${styleConfig.label} aesthetic.

Respond in JSON only:
[
  {"slide": 1, "headline": "...", "subtext": "...", "imagePrompt": "..."},
  ...
]`;
}

// === 숏츠 전용: 장면 구성 프롬프트 ===
export function buildShortsScriptPrompt(
  productInfo: ProductInfo,
  angle: string,
  hookingText: string,
  copyText: string,
  designStyle: DesignStyle
): string {
  const styleConfig = DESIGN_STYLE_CONFIG[designStyle];

  return `You are a Korean shorts/reels/tiktok video strategist creating a vertical video ad for ${productInfo.name}.

=== PRODUCT ===
${productInfo.name} - ${productInfo.description}
Target: ${productInfo.targetAudience}
Angle: ${angle}
Hook: "${hookingText}"

=== STYLE ===
${styleConfig.label}: ${styleConfig.description}

=== TASK ===
Create a 15-second vertical shorts video structure:
- 0-2s: HOOK - immediate attention grabber, must make viewer stop scrolling
- 3-6s: Problem/Pain point setup
- 7-11s: Solution reveal (product/app)
- 12-14s: Benefit/Transformation
- 15s: CTA with brand name

Provide:
1. overallConcept: Overall video concept in 1 sentence
2. caption: Korean caption/subtitle (will appear as overlay text throughout video)
3. hashtags: 5-8 relevant Korean + English hashtags for TikTok/Reels
4. scenes: Array of 5 scenes with specific shot descriptions
5. videoPrompt: Single detailed ENGLISH prompt for Veo 3 / Sora 2 to generate the video
   (must include: Korean setting, Korean people, camera movement, lighting, mood, style)
6. voiceoverScript: Korean voiceover script (optional, short)

The videoPrompt MUST be optimized for AI video models (Veo 3, Sora 2, Runway Gen-4).
Include: camera movement, subject actions, lighting, mood, duration, style.

Respond in JSON only:
{
  "overallConcept": "...",
  "caption": "...",
  "hashtags": ["...", "..."],
  "scenes": [
    {"time": "0-2s", "shot": "...", "action": "..."},
    ...
  ],
  "videoPrompt": "...",
  "voiceoverScript": "..."
}`;
}

// === 헬퍼: design style 기반 빠른 image prompt 생성 (fallback용) ===
export function buildQuickImagePrompt(
  productInfo: ProductInfo,
  designStyle: DesignStyle,
  assetType: AssetType,
  angle: string
): string {
  const style = DESIGN_STYLE_CONFIG[designStyle];
  const asset = ASSET_TYPE_CONFIG[assetType];
  const composition = ASSET_COMPOSITION_GUIDES[assetType];
  const scenes = CATEGORY_SCENE_TEMPLATES[productInfo.category];
  const scene = scenes[0];

  return `${scene}. Marketing photography for ${productInfo.name} (${angle} angle). ${composition}. ${style.promptSnippet}. ${CAMERA_PRESETS.lifestyle}. ${LIGHTING_PRESETS.naturalWindow}. Ultra high quality, photorealistic, editorial magazine quality, 8K resolution, Kodak Portra 400 film look. ${NEGATIVE_PROMPT}`;
}
