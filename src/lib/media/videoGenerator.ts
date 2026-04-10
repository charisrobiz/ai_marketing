// 동영상 생성 - 여러 모델 지원
// Runway Gen-4 Turbo / Veo 3 / Sora 2 / Kling

export type VideoModel =
  | 'runway-gen4-turbo'    // Runway Gen-4 Turbo (기본)
  | 'veo-3'                // Google Veo 3 (사운드 포함, 8초)
  | 'sora-2'               // OpenAI Sora 2 (최대 20초)
  | 'kling-2';             // Kling 2.0 (한국 특화)

export interface VideoGenerationOptions {
  model?: VideoModel;
  duration?: 5 | 8 | 10 | 15 | 20;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

interface RunwayTaskResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
}

// === Runway Gen-4 Turbo (기존) ===
async function generateWithRunway(
  runwayApiKey: string,
  imageUrl: string | undefined,
  prompt: string,
  duration: number = 5,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<string | null> {
  try {
    const endpoint = imageUrl
      ? 'https://api.dev.runwayml.com/v1/image_to_video'
      : 'https://api.dev.runwayml.com/v1/text_to_video';

    const body: Record<string, unknown> = {
      model: 'gen4_turbo',
      promptText: prompt,
      duration: Math.min(duration, 10) as 5 | 10,
      ratio: aspectRatio === '9:16' ? '9:16' : aspectRatio === '1:1' ? '1:1' : '16:9',
    };

    if (imageUrl) body.promptImage = imageUrl;

    const createRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayApiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) return null;
    const task: RunwayTaskResponse = await createRes.json();

    // 폴링
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${task.id}`, {
        headers: {
          'Authorization': `Bearer ${runwayApiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });
      if (!pollRes.ok) continue;
      const status: RunwayTaskResponse = await pollRes.json();
      if (status.status === 'SUCCEEDED' && status.output?.[0]) return status.output[0];
      if (status.status === 'FAILED') return null;
    }
    return null;
  } catch {
    return null;
  }
}

// === Google Veo 3 (Gemini API) ===
async function generateWithVeo3(
  geminiApiKey: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  imageUrl?: string
): Promise<string | null> {
  try {
    // Veo 3는 Gemini API를 통해 호출
    const body: Record<string, unknown> = {
      instances: [{
        prompt,
        aspectRatio,
        durationSeconds: 8,
        generateAudio: true,
      }],
    };

    if (imageUrl) {
      (body.instances as Array<Record<string, unknown>>)[0].image = { gcsUri: imageUrl };
    }

    const createRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:predictLongRunning?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!createRes.ok) return null;
    const data = await createRes.json();
    const operationName = data?.name;
    if (!operationName) return null;

    // 폴링
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${geminiApiKey}`,
        { method: 'GET' }
      );
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      if (pollData?.done) {
        const videoUri = pollData?.response?.predictions?.[0]?.videoUri;
        return videoUri || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// === OpenAI Sora 2 ===
async function generateWithSora2(
  openaiApiKey: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '9:16',
  duration: number = 10
): Promise<string | null> {
  try {
    const createRes = await fetch('https://api.openai.com/v1/videos/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sora-2',
        prompt,
        aspect_ratio: aspectRatio,
        duration_seconds: Math.min(duration, 20),
      }),
    });

    if (!createRes.ok) return null;
    const data = await createRes.json();
    const videoId = data?.id;
    if (!videoId) return null;

    // 폴링
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
        headers: { 'Authorization': `Bearer ${openaiApiKey}` },
      });
      if (!pollRes.ok) continue;
      const status = await pollRes.json();
      if (status?.status === 'succeeded' && status?.url) return status.url;
      if (status?.status === 'failed') return null;
    }
    return null;
  } catch {
    return null;
  }
}

// === 통합 인터페이스 (기존 호환) ===
export async function generateVideo(
  runwayApiKey: string,
  imageUrl: string,
  prompt: string
): Promise<string | null> {
  return generateWithRunway(runwayApiKey, imageUrl, prompt, 5, '16:9');
}

export async function generateVideoFromText(
  runwayApiKey: string,
  prompt: string
): Promise<string | null> {
  return generateWithRunway(runwayApiKey, undefined, prompt, 5, '16:9');
}

// === 새 통합 인터페이스 ===
export async function generateVideoAdvanced(
  settings: {
    runwayApiKey?: string;
    geminiApiKey?: string;
    openaiApiKey?: string;
  },
  prompt: string,
  options: VideoGenerationOptions & { imageUrl?: string } = {}
): Promise<{ url: string; model: string } | null> {
  const model = options.model || 'runway-gen4-turbo';
  const duration = options.duration || 5;
  const aspectRatio = options.aspectRatio || '9:16';

  switch (model) {
    case 'veo-3':
      if (!settings.geminiApiKey) return null;
      const veoUrl = await generateWithVeo3(
        settings.geminiApiKey,
        prompt,
        aspectRatio === '1:1' ? '16:9' : aspectRatio,
        options.imageUrl
      );
      return veoUrl ? { url: veoUrl, model: 'veo-3' } : null;

    case 'sora-2':
      if (!settings.openaiApiKey) return null;
      const soraUrl = await generateWithSora2(
        settings.openaiApiKey,
        prompt,
        aspectRatio === '1:1' ? '9:16' : aspectRatio,
        duration
      );
      return soraUrl ? { url: soraUrl, model: 'sora-2' } : null;

    case 'runway-gen4-turbo':
    default:
      if (!settings.runwayApiKey) return null;
      const runwayUrl = await generateWithRunway(
        settings.runwayApiKey,
        options.imageUrl,
        prompt,
        duration,
        aspectRatio
      );
      return runwayUrl ? { url: runwayUrl, model: 'runway-gen4-turbo' } : null;
  }
}
