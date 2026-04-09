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

async function callGemini(apiKey: string, prompt: string, model = 'gemini-2.5-flash'): Promise<LLMResponse> {
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

// 작업 타입: simple(단순) | analysis(분석/추론)
export type TaskType = 'simple' | 'analysis';

interface LLMSettings {
  openaiApiKey?: string;
  claudeApiKey?: string;
  geminiApiKey?: string;
}

// 작업 타입별 모델 우선순위
// analysis: 정확도 중요 → Claude > GPT-4o > Gemini 2.5 Pro
// simple: 비용 효율 중요 → GPT-4o-mini > Gemini 2.5 Flash > Claude
function selectProviderAndModel(
  settings: LLMSettings,
  taskType: TaskType
): { provider: Provider; apiKey: string; model: string } | null {
  if (taskType === 'analysis') {
    // 분석 작업: Claude Sonnet > GPT-4o > Gemini Pro
    if (settings.claudeApiKey) return { provider: 'claude', apiKey: settings.claudeApiKey, model: 'claude-sonnet-4-20250514' };
    if (settings.openaiApiKey) return { provider: 'openai', apiKey: settings.openaiApiKey, model: 'gpt-4o' };
    if (settings.geminiApiKey) return { provider: 'gemini', apiKey: settings.geminiApiKey, model: 'gemini-2.5-pro' };
  } else {
    // 단순 작업: GPT-4o-mini > Gemini 2.5 Flash > Claude
    if (settings.openaiApiKey) return { provider: 'openai', apiKey: settings.openaiApiKey, model: 'gpt-4o-mini' };
    if (settings.geminiApiKey) return { provider: 'gemini', apiKey: settings.geminiApiKey, model: 'gemini-2.5-flash' };
    if (settings.claudeApiKey) return { provider: 'claude', apiKey: settings.claudeApiKey, model: 'claude-sonnet-4-20250514' };
  }
  return null;
}

// 모델 ID로부터 provider 추측
function detectProvider(model: string): Provider | null {
  if (model.startsWith('gpt-')) return 'openai';
  if (model.startsWith('claude-')) return 'claude';
  if (model.startsWith('gemini-')) return 'gemini';
  return null;
}

export async function callLLM(
  settings: LLMSettings,
  prompt: string,
  taskType: TaskType = 'simple',
  overrideModel?: string
): Promise<LLMResponse> {
  // override 모델이 지정되면 우선 사용 (provider 자동 감지 + 키 확인)
  if (overrideModel) {
    const provider = detectProvider(overrideModel);
    if (provider) {
      const keyMap: Record<Provider, string | undefined> = {
        openai: settings.openaiApiKey,
        claude: settings.claudeApiKey,
        gemini: settings.geminiApiKey,
      };
      const apiKey = keyMap[provider];
      if (apiKey) {
        switch (provider) {
          case 'openai': return callOpenAI(apiKey, prompt, overrideModel);
          case 'claude': return callClaude(apiKey, prompt, overrideModel);
          case 'gemini': return callGemini(apiKey, prompt, overrideModel);
        }
      }
      // override 모델의 API 키가 없으면 자동 선택으로 fallback
    }
  }

  const selected = selectProviderAndModel(settings, taskType);
  if (!selected) {
    throw new Error('API 키가 설정되지 않았습니다. 관리자 페이지에서 API 키를 입력해주세요.');
  }

  switch (selected.provider) {
    case 'openai': return callOpenAI(selected.apiKey, prompt, selected.model);
    case 'claude': return callClaude(selected.apiKey, prompt, selected.model);
    case 'gemini': return callGemini(selected.apiKey, prompt, selected.model);
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
