import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 캠페인별 비용/사용량 집계
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;

  const { data: logs } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  const allLogs = logs || [];

  // 총 합계
  const totalCost = allLogs.reduce((sum, log) => sum + Number(log.cost_usd), 0);
  const totalInputTokens = allLogs.reduce((sum, log) => sum + (log.input_tokens || 0), 0);
  const totalOutputTokens = allLogs.reduce((sum, log) => sum + (log.output_tokens || 0), 0);
  const totalCalls = allLogs.length;

  // 직원별 집계
  const byAgent: Record<string, { name: string; calls: number; cost: number; tokens: number }> = {};
  for (const log of allLogs) {
    const key = log.agent_id;
    if (!byAgent[key]) byAgent[key] = { name: log.agent_name, calls: 0, cost: 0, tokens: 0 };
    byAgent[key].calls++;
    byAgent[key].cost += Number(log.cost_usd);
    byAgent[key].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
  }

  // Phase별 집계
  const byPhase: Record<string, { calls: number; cost: number }> = {};
  for (const log of allLogs) {
    const key = log.phase;
    if (!byPhase[key]) byPhase[key] = { calls: 0, cost: 0 };
    byPhase[key].calls++;
    byPhase[key].cost += Number(log.cost_usd);
  }

  // 모델별 집계
  const byModel: Record<string, { calls: number; cost: number; tokens: number }> = {};
  for (const log of allLogs) {
    if (!log.model) continue;
    const key = log.model;
    if (!byModel[key]) byModel[key] = { calls: 0, cost: 0, tokens: 0 };
    byModel[key].calls++;
    byModel[key].cost += Number(log.cost_usd);
    byModel[key].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
  }

  // 미디어 합계
  const mediaCost = allLogs.filter((l) => l.media_type).reduce((sum, l) => sum + Number(l.cost_usd), 0);
  const mediaCount = allLogs.filter((l) => l.media_type).reduce((sum, l) => sum + (l.media_count || 0), 0);

  return NextResponse.json({
    summary: {
      totalCost,
      totalCostKRW: Math.round(totalCost * 1430),
      totalCalls,
      totalInputTokens,
      totalOutputTokens,
      mediaCost,
      mediaCount,
    },
    byAgent,
    byPhase,
    byModel,
    recentLogs: allLogs.slice(0, 30),
  });
}
