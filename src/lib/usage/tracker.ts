// AI 사용량 추적 + 비용 계산

import { supabase } from '@/lib/db/supabase';
import type { LLMResponse } from '@/lib/ai/llmClient';

// 모델별 가격 (USD per 1M tokens)
const LLM_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  // Claude
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  // Gemini
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.0-flash-exp': { input: 0.10, output: 0.40 },
};

// 미디어 가격 (USD per item)
const MEDIA_PRICING: Record<string, number> = {
  'gemini-image': 0.04,
  'runway-video': 0.25,
  'gemini-banner': 0.04,
};

export function calculateLLMCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = LLM_PRICING[model] || LLM_PRICING['gpt-4o-mini'];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export function calculateMediaCost(mediaType: string, count: number): number {
  return (MEDIA_PRICING[mediaType] || 0) * count;
}

export interface UsageContext {
  campaignId: string;
  agentId: string;
  agentName: string;
  phase: string;
  taskDescription?: string;
  mode?: 'demo' | 'production';
}

export async function logLLMUsage(context: UsageContext, response: LLMResponse): Promise<void> {
  if (context.mode === 'demo') return;

  const cost = calculateLLMCost(response.model, response.inputTokens, response.outputTokens);

  await supabase.from('ai_usage_logs').insert({
    campaign_id: context.campaignId,
    agent_id: context.agentId,
    agent_name: context.agentName,
    phase: context.phase,
    task_description: context.taskDescription || null,
    provider: response.provider,
    model: response.model,
    input_tokens: response.inputTokens,
    output_tokens: response.outputTokens,
    cost_usd: cost,
    mode: context.mode || 'production',
  });
}

export async function logMediaUsage(
  context: UsageContext,
  mediaType: 'gemini-image' | 'runway-video' | 'gemini-banner',
  count: number
): Promise<void> {
  if (context.mode === 'demo') return;

  const cost = calculateMediaCost(mediaType, count);

  await supabase.from('ai_usage_logs').insert({
    campaign_id: context.campaignId,
    agent_id: context.agentId,
    agent_name: context.agentName,
    phase: context.phase,
    task_description: context.taskDescription || null,
    media_type: mediaType,
    media_count: count,
    cost_usd: cost,
    mode: context.mode || 'production',
  });
}
