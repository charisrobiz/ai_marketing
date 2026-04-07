// Runway Gen-4 Turbo 동영상 생성

const RUNWAY_API_URL = 'https://api.dev.runwayml.com/v1';

interface RunwayTaskResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
}

// 이미지 → 동영상 생성 요청
export async function generateVideo(
  runwayApiKey: string,
  imageUrl: string,
  prompt: string
): Promise<string | null> {
  try {
    // 1. 생성 요청
    const createRes = await fetch(`${RUNWAY_API_URL}/image_to_video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayApiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen4_turbo',
        promptImage: imageUrl,
        promptText: prompt,
        duration: 5,
        ratio: '16:9',
      }),
    });

    if (!createRes.ok) return null;

    const task: RunwayTaskResponse = await createRes.json();
    const taskId = task.id;

    // 2. 폴링으로 완료 대기 (최대 120초)
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const pollRes = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${runwayApiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!pollRes.ok) continue;

      const status: RunwayTaskResponse = await pollRes.json();

      if (status.status === 'SUCCEEDED' && status.output && status.output.length > 0) {
        return status.output[0];
      }

      if (status.status === 'FAILED') return null;
    }

    return null;
  } catch {
    return null;
  }
}

// 텍스트 → 동영상 생성 (이미지 없이)
export async function generateVideoFromText(
  runwayApiKey: string,
  prompt: string
): Promise<string | null> {
  try {
    const createRes = await fetch(`${RUNWAY_API_URL}/text_to_video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayApiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen4_turbo',
        promptText: prompt,
        duration: 5,
        ratio: '16:9',
      }),
    });

    if (!createRes.ok) return null;

    const task: RunwayTaskResponse = await createRes.json();
    const taskId = task.id;

    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));

      const pollRes = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${runwayApiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!pollRes.ok) continue;

      const status: RunwayTaskResponse = await pollRes.json();

      if (status.status === 'SUCCEEDED' && status.output && status.output.length > 0) {
        return status.output[0];
      }

      if (status.status === 'FAILED') return null;
    }

    return null;
  } catch {
    return null;
  }
}
