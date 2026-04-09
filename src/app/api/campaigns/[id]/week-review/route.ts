import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';
import { buildWeeklyAnalysisPrompt, buildAgentOpinionPrompt, buildHeadDecisionPrompt } from '@/lib/ai/prompts';
import { logLLMUsage } from '@/lib/usage/tracker';
import { getMetaAdInsights, getMetaInstalls } from '@/lib/integrations/metaAds';
import { getGoogleAdsMetrics } from '@/lib/integrations/googleAds';
import { getFirebaseAnalytics } from '@/lib/integrations/firebase';
import { getAppsFlyerOverview } from '@/lib/integrations/appsflyer';

async function addEvent(campaignId: string, agentId: string, agentName: string, type: string, content: string) {
  await supabase.from('live_events').insert({
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    agent_id: agentId,
    agent_name: agentName,
    type,
    content,
  });
}

async function getSettings() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  for (const r of rows || []) map[r.key] = r.value;
  return map;
}

// === Demo 메트릭 (시뮬레이션 전용) ===
const DEMO_METRICS: Record<number, { installs: number; cac: number; organic: number; paid: number; topChannel: string; ctr: number; cvr: number }> = {
  1: { installs: 1200, cac: 0, organic: 85, paid: 15, topChannel: '인스타 릴스', ctr: 4.2, cvr: 8.5 },
  2: { installs: 3800, cac: 450, organic: 60, paid: 40, topChannel: 'UGC 챌린지', ctr: 5.1, cvr: 9.2 },
  3: { installs: 7200, cac: 680, organic: 35, paid: 65, topChannel: 'Meta 광고', ctr: 4.8, cvr: 7.8 },
  4: { installs: 10500, cac: 720, organic: 30, paid: 70, topChannel: '레퍼럴', ctr: 4.5, cvr: 7.2 },
};

async function fetchRealMetrics(settings: Record<string, string>) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const result: Record<string, unknown> = {};
  let hasAnyData = false;

  if (settings.metaAdsToken && settings.metaAdAccountId) {
    const meta = await getMetaAdInsights(settings.metaAdsToken, settings.metaAdAccountId, { since: fmt(weekAgo), until: fmt(now) });
    if (meta) {
      const installs = meta.campaigns.reduce((sum, c) => sum + getMetaInstalls(c.insights), 0);
      result.meta = { impressions: meta.summary.impressions, clicks: meta.summary.clicks, spend: meta.summary.spend, ctr: meta.summary.ctr, cpc: meta.summary.cpc, installs };
      hasAnyData = true;
    }
  }

  if (settings.googleAdsToken && settings.googleAdsDeveloperToken && settings.googleAdsCustomerId) {
    const google = await getGoogleAdsMetrics(settings.googleAdsToken, settings.googleAdsDeveloperToken, settings.googleAdsCustomerId, { startDate: fmt(weekAgo), endDate: fmt(now) });
    if (google) {
      result.google = { impressions: google.impressions, clicks: google.clicks, cost: google.cost, conversions: google.conversions };
      hasAnyData = true;
    }
  }

  if (settings.firebaseProjectId && settings.firebaseServiceAccountKey) {
    const firebase = await getFirebaseAnalytics(settings.firebaseProjectId, settings.firebaseServiceAccountKey, { startDate: fmt(weekAgo), endDate: fmt(now) });
    if (firebase) {
      result.firebase = firebase;
      hasAnyData = true;
    }
  }

  if (settings.appsflyerApiToken && settings.appsflyerAppId) {
    const af = await getAppsFlyerOverview(settings.appsflyerApiToken, settings.appsflyerAppId, { from: fmt(weekAgo), to: fmt(now) });
    if (af) {
      result.appsflyer = af;
      hasAnyData = true;
    }
  }

  return hasAnyData ? result : null;
}

// POST: 주간 리뷰 미팅 실행
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const body = await request.json();
  const { currentWeek } = body;

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const mode = (campaign.campaign_mode || 'production') as 'demo' | 'production';
  const productInfo = campaign.product_info;
  const nextWeek = currentWeek + 1;
  const settings = await getSettings();

  await addEvent(campaignId, 'hana', '하나', 'chat', `팀 여러분, Week ${currentWeek} 리뷰 미팅을 시작합니다.`);

  // === DEMO MODE: 하드코딩 시뮬레이션 ===
  if (mode === 'demo') {
    const m = DEMO_METRICS[currentWeek] || DEMO_METRICS[1];
    await addEvent(campaignId, 'eunji', '은지', 'chat', `[데모] Week ${currentWeek} 데이터: 누적 ${m.installs.toLocaleString()}명, CAC ${m.cac}원, 오가닉 ${m.organic}%`);
    await addEvent(campaignId, 'minseo', '민서', 'chat', `[데모] 시뮬레이션 메트릭 기반 Week ${nextWeek} 전략 수립...`);
    await addEvent(campaignId, 'hana', '하나', 'system', `🎬 데모 Week ${currentWeek} 리뷰 완료.`);

    if (nextWeek <= 4) {
      await supabase.from('daily_plans').update({ status: 'completed' }).eq('campaign_id', campaignId).eq('week', currentWeek);
      await supabase.from('daily_plans').update({ status: 'in_progress' }).eq('campaign_id', campaignId).eq('week', nextWeek);
    } else {
      await supabase.from('daily_plans').update({ status: 'completed' }).eq('campaign_id', campaignId).eq('week', currentWeek);
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaignId);
    }

    return NextResponse.json({ mode: 'demo', currentWeek, nextWeek: nextWeek <= 4 ? nextWeek : null, metrics: m });
  }

  // === PRODUCTION MODE: 실제 AI 분석 ===
  const hasLLM = settings.openaiApiKey || settings.claudeApiKey || settings.geminiApiKey;
  if (!hasLLM) {
    return NextResponse.json({ error: '주간 리뷰에는 AI LLM API 키가 필요합니다.' }, { status: 400 });
  }

  // 1. 실제 메트릭 수집
  await addEvent(campaignId, 'eunji', '은지', 'chat', `Week ${currentWeek} 외부 API에서 실제 지표를 수집합니다...`);
  const realMetrics = await fetchRealMetrics(settings);

  if (!realMetrics) {
    await addEvent(campaignId, 'eunji', '은지', 'system', `⚠️ 외부 API 미연동 또는 데이터 없음. Meta Ads / Google Ads / Firebase / AppsFlyer 중 하나 이상의 키를 등록해주세요.`);
    return NextResponse.json({ error: '실제 지표를 가져올 수 없습니다. 외부 API 연동을 확인해주세요.' }, { status: 400 });
  }

  // 2. 은지: LLM 분석
  await addEvent(campaignId, 'eunji', '은지', 'chat', `데이터 수집 완료. AI 분석 시작합니다.`);
  let analysis: { summary: string; insights: string[]; risks: string[]; strengths: string[]; kpiHighlight: string };
  try {
    const analysisPrompt = buildWeeklyAnalysisPrompt(productInfo.name, currentWeek, realMetrics, null);
    const res = await callLLM({
      openaiApiKey: settings.openaiApiKey || '',
      claudeApiKey: settings.claudeApiKey || '',
      geminiApiKey: settings.geminiApiKey || '',
    }, analysisPrompt, 'analysis');
    await logLLMUsage({ campaignId, agentId: 'eunji', agentName: '은지', phase: 'week-review', taskDescription: `Week ${currentWeek} 데이터 분석`, mode }, res);
    analysis = parseJSONResponse(res.content);
    await addEvent(campaignId, 'eunji', '은지', 'chat', `📊 ${analysis.summary}`);
    for (const insight of analysis.insights) {
      await addEvent(campaignId, 'eunji', '은지', 'chat', `• ${insight}`);
    }
  } catch (err) {
    return NextResponse.json({ error: `데이터 분석 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` }, { status: 500 });
  }

  // 3. 팀원 의견 (4명 LLM 호출)
  const teamMembers = [
    { id: 'minseo', name: '민서', role: '마케팅 전략가' },
    { id: 'taeyang', name: '태양', role: '퍼포먼스 마케터' },
    { id: 'jiwoo', name: '지우', role: 'SEO 카피라이터' },
    { id: 'yuna', name: '유나', role: '크리에이티브 디렉터' },
  ];

  const opinions: Array<{ name: string; opinion: string; recommendation: string }> = [];

  for (const member of teamMembers) {
    try {
      const opinionPrompt = buildAgentOpinionPrompt(member.role, member.name, productInfo.name, currentWeek, analysis);
      const res = await callLLM({
        openaiApiKey: settings.openaiApiKey || '',
        claudeApiKey: settings.claudeApiKey || '',
        geminiApiKey: settings.geminiApiKey || '',
      }, opinionPrompt, 'analysis');
      await logLLMUsage({ campaignId, agentId: member.id, agentName: member.name, phase: 'week-review', taskDescription: `Week ${currentWeek} ${member.role} 의견`, mode }, res);
      const result = parseJSONResponse<{ opinion: string; recommendation: string }>(res.content);
      opinions.push({ name: member.name, opinion: result.opinion, recommendation: result.recommendation });
      await addEvent(campaignId, member.id, member.name, 'chat', result.opinion);
      await addEvent(campaignId, member.id, member.name, 'chat', `💡 제안: ${result.recommendation}`);
    } catch {
      await addEvent(campaignId, member.id, member.name, 'system', `⚠️ 의견 생성 실패`);
    }
  }

  // 4. 본부장 종합 결정
  let decision: { decision: string; actionItems: Array<{ agent: string; action: string }>; nextWeekFocus: string };
  try {
    const decisionPrompt = buildHeadDecisionPrompt(productInfo.name, currentWeek, analysis, opinions);
    const res = await callLLM({
      openaiApiKey: settings.openaiApiKey || '',
      claudeApiKey: settings.claudeApiKey || '',
      geminiApiKey: settings.geminiApiKey || '',
    }, decisionPrompt, 'analysis');
    await logLLMUsage({ campaignId, agentId: 'hana', agentName: '하나', phase: 'week-review', taskDescription: `Week ${currentWeek} 본부장 종합 결정`, mode }, res);
    decision = parseJSONResponse(res.content);
    await addEvent(campaignId, 'hana', '하나', 'chat', decision.decision);
    await addEvent(campaignId, 'hana', '하나', 'chat', `🎯 Week ${nextWeek} 핵심 포커스: ${decision.nextWeekFocus}`);
    for (const item of decision.actionItems) {
      await addEvent(campaignId, 'hana', '하나', 'chat', `📋 ${item.agent}: ${item.action}`);
    }
  } catch (err) {
    return NextResponse.json({ error: `본부장 결정 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}` }, { status: 500 });
  }

  // 5. 다음 주차로 진행
  if (nextWeek <= 4) {
    await addEvent(campaignId, 'hana', '하나', 'system', `Week ${currentWeek} 리뷰 완료. Week ${nextWeek} 진행 시작합니다.`);
    await supabase.from('daily_plans').update({ status: 'completed' }).eq('campaign_id', campaignId).eq('week', currentWeek);
    await supabase.from('daily_plans').update({ status: 'in_progress' }).eq('campaign_id', campaignId).eq('week', nextWeek);
  } else {
    await addEvent(campaignId, 'hana', '하나', 'system', `4주 캠페인 완료!`);
    await supabase.from('daily_plans').update({ status: 'completed' }).eq('campaign_id', campaignId).eq('week', currentWeek);
    await supabase.from('campaigns').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', campaignId);
  }

  return NextResponse.json({
    mode: 'production',
    currentWeek,
    nextWeek: nextWeek <= 4 ? nextWeek : null,
    metrics: realMetrics,
    analysis,
    opinions,
    decision,
  });
}
