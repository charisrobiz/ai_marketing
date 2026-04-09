// Unified LLM client that supports OpenAI, Claude, and Gemini

export type Provider = 'openai' | 'claude' | 'gemini';

export interface LLMResponse {
  content: string;
  model: string;
  provider: Provider;
  inputTokens: number;
  outputTokens: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2.5);
}

async function callOpenAI(apiKey: string, prompt: string, model = 'gpt-4o-mini'): Promise<LLMResponse> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0].message.content,
    model,
    provider: 'openai',
    inputTokens: data.usage?.prompt_tokens ?? estimateTokens(prompt),
    outputTokens: data.usage?.completion_tokens ?? estimateTokens(data.choices[0].message.content),
  };
}

async function callClaude(apiKey: string, prompt: string, model = 'claude-sonnet-4-20250514'): Promise<LLMResponse> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  return {
    content: data.content[0].text,
    model,
    provider: 'claude',
    inputTokens: data.usage?.input_tokens ?? estimateTokens(prompt),
    outputTokens: data.usage?.output_tokens ?? estimateTokens(data.content[0].text),
  };
}

async function callGemini(apiKey: string, prompt: string, model = 'gemini-2.0-flash'): Promise<LLMResponse> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const content = data.candidates[0].content.parts[0].text;
  return {
    content,
    model,
    provider: 'gemini',
    inputTokens: data.usageMetadata?.promptTokenCount ?? estimateTokens(prompt),
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? estimateTokens(content),
  };
}

function getAvailableProvider(settings: {
  openaiApiKey?: string;
  claudeApiKey?: string;
  geminiApiKey?: string;
}): { provider: Provider; apiKey: string } | null {
  if (settings.openaiApiKey) return { provider: 'openai', apiKey: settings.openaiApiKey };
  if (settings.claudeApiKey) return { provider: 'claude', apiKey: settings.claudeApiKey };
  if (settings.geminiApiKey) return { provider: 'gemini', apiKey: settings.geminiApiKey };
  return null;
}

export async function callLLM(
  settings: { openaiApiKey?: string; claudeApiKey?: string; geminiApiKey?: string },
  prompt: string,
  preferredProvider?: Provider
): Promise<LLMResponse> {
  // Use preferred provider if available
  if (preferredProvider) {
    const keyMap: Record<Provider, string | undefined> = {
      openai: settings.openaiApiKey,
      claude: settings.claudeApiKey,
      gemini: settings.geminiApiKey,
    };
    const apiKey = keyMap[preferredProvider];
    if (apiKey) {
      switch (preferredProvider) {
        case 'openai': return callOpenAI(apiKey, prompt);
        case 'claude': return callClaude(apiKey, prompt);
        case 'gemini': return callGemini(apiKey, prompt);
      }
    }
  }

  // Fallback to any available provider
  const available = getAvailableProvider(settings);
  if (!available) {
    throw new Error('API 키가 설정되지 않았습니다. 관리자 페이지에서 API 키를 입력해주세요.');
  }

  switch (available.provider) {
    case 'openai': return callOpenAI(available.apiKey, prompt);
    case 'claude': return callClaude(available.apiKey, prompt);
    case 'gemini': return callGemini(available.apiKey, prompt);
  }
}

export function parseJSONResponse<T>(content: string): T {
  // Extract JSON from markdown code blocks or raw JSON
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from LLM response');
  }
  return JSON.parse(jsonMatch[1].trim());
}
