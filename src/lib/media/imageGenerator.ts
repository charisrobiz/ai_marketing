// Nano Banana 2 (Gemini) 이미지 생성

const GEMINI_MODEL = 'gemini-2.0-flash-exp';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function generateImage(
  geminiApiKey: string,
  prompt: string
): Promise<{ imageBase64: string; mimeType: string } | null> {
  try {
    const response = await fetch(
      `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a high-quality marketing image for the following concept. Make it visually striking, modern, and suitable for social media advertising.\n\n${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
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
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
