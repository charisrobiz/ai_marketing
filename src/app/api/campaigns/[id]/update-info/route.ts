import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';

async function getSettings() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  for (const r of rows || []) map[r.key] = r.value;
  return map;
}

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

// PATCH: 캠페인 정보 수정 + 본부장 변경 영향도 분석
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const body = await request.json();
  const { productInfo: newInfo } = body;

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const oldInfo = campaign.product_info;
  const settings = await getSettings();

  // DB 업데이트
  await supabase.from('campaigns').update({
    product_info: newInfo,
    updated_at: new Date().toISOString(),
  }).eq('id', campaignId);

  // 변경 사항 비교
  const changes: string[] = [];
  if (oldInfo.name !== newInfo.name) changes.push(`이름: "${oldInfo.name}" → "${newInfo.name}"`);
  if (oldInfo.description !== newInfo.description) changes.push(`설명 변경`);
  if (oldInfo.targetAudience !== newInfo.targetAudience) changes.push(`타겟 고객: "${oldInfo.targetAudience}" → "${newInfo.targetAudience}"`);
  if (oldInfo.uniqueValue !== newInfo.uniqueValue) changes.push(`핵심 차별점: "${oldInfo.uniqueValue}" → "${newInfo.uniqueValue}"`);
  if (oldInfo.category !== newInfo.category) changes.push(`카테고리 변경`);

  if (changes.length === 0) {
    return NextResponse.json({ impact: 'none', message: '변경 사항 없음' });
  }

  // 본부장 하나의 변경 영향도 분석
  await addEvent(campaignId, 'hana', '하나', 'system', `캠페인 정보 변경이 감지되었습니다. 변경 영향도를 분석합니다.`);
  await addEvent(campaignId, 'hana', '하나', 'chat', `변경 사항: ${changes.join(' / ')}`);

  let impactResult: {
    level: 'minor' | 'partial' | 'major';
    reason: string;
    affected_areas: string[];
    recommendation: string;
  };

  try {
    const prompt = `당신은 마케팅 본부장 "하나"입니다. 진행 중인 캠페인의 제품 정보가 변경되었습니다.
변경 사항이 기존 마케팅 전략에 미치는 영향을 분석하세요.

[기존 정보]
- 이름: ${oldInfo.name}
- 설명: ${oldInfo.description}
- 타겟: ${oldInfo.targetAudience}
- 차별점: ${oldInfo.uniqueValue}

[변경된 정보]
- 이름: ${newInfo.name}
- 설명: ${newInfo.description}
- 타겟: ${newInfo.targetAudience}
- 차별점: ${newInfo.uniqueValue}

[변경 사항]
${changes.join('\n')}

다음 기준으로 영향도를 판단하세요:
- "minor": 오타 수정, 설명 보완 등 마케팅에 영향 없음
- "partial": 타겟 변경, 기능 추가 등 일부 소재/전략 수정 필요
- "major": 핵심 기능 변경, 피봇 등 전략/소재/플랜 전면 재수립 필요

반드시 JSON으로만 응답:
{"level":"partial","reason":"타겟 고객이 변경되어 카피라이팅 톤 조정 필요","affected_areas":["카피라이팅","타겟팅 광고"],"recommendation":"공감형/바이럴형 카피를 새 타겟에 맞게 수정하고, 퍼포먼스 광고 타겟 세그먼트를 재설정"}`;

    const response = await callLLM({
      openaiApiKey: settings.openaiApiKey || '',
      claudeApiKey: settings.claudeApiKey || '',
      geminiApiKey: settings.geminiApiKey || '',
    }, prompt, 'analysis');
    impactResult = parseJSONResponse(response.content);
  } catch {
    const hasTargetChange = oldInfo.targetAudience !== newInfo.targetAudience;
    const hasValueChange = oldInfo.uniqueValue !== newInfo.uniqueValue;
    const hasNameChange = oldInfo.name !== newInfo.name;
    const hasCategoryChange = oldInfo.category !== newInfo.category;

    if (hasCategoryChange || (hasNameChange && hasValueChange)) {
      impactResult = { level: 'major', reason: '핵심 정보가 크게 변경되어 전면 재수립 필요', affected_areas: ['마케팅 플랜', '카피라이팅', '비주얼', '타겟팅', 'SEO'], recommendation: '30일 플랜, 소재, 광고 세팅 전체 재작업' };
    } else if (hasTargetChange || hasValueChange) {
      impactResult = { level: 'partial', reason: '타겟 또는 차별점 변경으로 일부 수정 필요', affected_areas: hasTargetChange ? ['카피라이팅', '타겟팅 광고', 'SEO 키워드'] : ['카피라이팅', '비주얼 컨셉'], recommendation: '해당 영역의 소재를 새 정보에 맞게 수정' };
    } else {
      impactResult = { level: 'minor', reason: '마케팅에 영향 없는 단순 변경', affected_areas: [], recommendation: '기존 전략 유지' };
    }
  }

  // === 영향도별 내부 회의 진행 ===
  if (impactResult.level === 'minor') {
    await addEvent(campaignId, 'hana', '하나', 'chat', `분석 결과: 단순 변경입니다. ${impactResult.reason}`);
    await addEvent(campaignId, 'hana', '하나', 'system', `✅ 기존 마케팅 전략 유지. 변경 사항을 팀에 공유합니다.`);
    await addEvent(campaignId, 'minseo', '민서', 'chat', `확인했습니다. 기존 플랜 그대로 진행하겠습니다.`);
  } else if (impactResult.level === 'partial') {
    await addEvent(campaignId, 'hana', '하나', 'chat', `분석 결과: 일부 조정이 필요합니다. ${impactResult.reason}`);
    await addEvent(campaignId, 'hana', '하나', 'system', `📝 긴급 내부 미팅을 소집합니다. 영향 범위: ${impactResult.affected_areas.join(', ')}`);
    await addEvent(campaignId, 'hana', '하나', 'chat', `팀 여러분, 캠페인 정보가 변경되었습니다. 영향받는 영역만 빠르게 수정합시다.`);
    await addEvent(campaignId, 'hana', '하나', 'chat', `추천 방향: ${impactResult.recommendation}`);

    if (impactResult.affected_areas.includes('카피라이팅')) {
      await addEvent(campaignId, 'jiwoo', '지우', 'chat', `변경된 정보 확인했어요. 기존 카피 중 영향받는 부분만 수정하겠습니다.`);
      await addEvent(campaignId, 'minseo', '민서', 'chat', `지우님 동의합니다. 위너 소재의 톤은 유지하되, 변경된 부분만 반영해주세요.`);
    }
    if (impactResult.affected_areas.includes('비주얼') || impactResult.affected_areas.includes('비주얼 컨셉')) {
      await addEvent(campaignId, 'yuna', '유나', 'chat', `비주얼 가이드라인 중 해당 부분만 업데이트할게요. 전체 무드는 유지합니다.`);
    }
    if (impactResult.affected_areas.includes('타겟팅 광고') || impactResult.affected_areas.includes('타겟팅')) {
      await addEvent(campaignId, 'taeyang', '태양', 'chat', `타겟 세그먼트 조정이 필요하면 바로 반영하겠습니다.`);
      await addEvent(campaignId, 'eunji', '은지', 'chat', `기존 성과 데이터와 비교 분석해서 새 타겟의 예상 CPA도 산출해드릴게요.`);
    }
    if (impactResult.affected_areas.includes('SEO') || impactResult.affected_areas.includes('SEO 키워드')) {
      await addEvent(campaignId, 'jiwoo', '지우', 'chat', `SEO 키워드도 재점검할게요. 기존 인덱싱된 콘텐츠는 유지하면서 새 키워드를 추가합니다.`);
    }

    await addEvent(campaignId, 'hana', '하나', 'chat', `좋습니다. 각자 담당 영역 수정 진행해주세요.`);
    await addEvent(campaignId, 'hana', '하나', 'system', `📋 일부 수정 진행 중. 수정 완료 후 본부장 재검토 예정.`);
  } else {
    await addEvent(campaignId, 'hana', '하나', 'chat', `분석 결과: 전면 재수립이 필요합니다! ${impactResult.reason}`);
    await addEvent(campaignId, 'hana', '하나', 'system', `🚨 긴급 전체 회의 소집! 마케팅 전략 전면 재검토가 필요합니다.`);
    await addEvent(campaignId, 'hana', '하나', 'chat', `전원 집중해주세요. 핵심 정보가 크게 바뀌어서 기존 전략을 그대로 가져갈 수 없습니다.`);
    await addEvent(campaignId, 'minseo', '민서', 'chat', `본부장님, 변경 내용 확인했습니다. 30일 플랜을 새 정보 기반으로 재수립해야 할 것 같아요.`);
    await addEvent(campaignId, 'jiwoo', '지우', 'chat', `카피라이팅 전면 재작업 들어갈게요. SEO 키워드도 완전히 다시 잡아야 합니다.`);
    await addEvent(campaignId, 'yuna', '유나', 'chat', `비주얼 컨셉도 바뀌어야 해요. 새 제품 포지셔닝에 맞는 무드보드부터 다시 시작합니다.`);
    await addEvent(campaignId, 'doha', '도하', 'chat', `기존 숏폼 소재는 폐기하고, 새 컨셉으로 재제작할게요.`);
    await addEvent(campaignId, 'taeyang', '태양', 'chat', `광고 캠페인도 전면 재설정합니다.`);
    await addEvent(campaignId, 'eunji', '은지', 'chat', `기존 투표/성과 데이터는 아카이브하고, 새 기준으로 분석 대시보드를 리셋하겠습니다.`);
    await addEvent(campaignId, 'siwon', '시원', 'chat', `파이프라인 재가동 준비 완료입니다.`);
    await addEvent(campaignId, 'hana', '하나', 'chat', `모두 감사합니다. 새 정보 기반으로 전략 재수립 → 소재 재생성 → 투표 → 승인 순으로 진행합니다.`);
    await addEvent(campaignId, 'hana', '하나', 'system', `🔄 전면 재수립 착수. 새 엔진 실행이 필요합니다.`);
  }

  return NextResponse.json({
    impact: impactResult.level,
    reason: impactResult.reason,
    affected_areas: impactResult.affected_areas,
    recommendation: impactResult.recommendation,
    changes,
  });
}
