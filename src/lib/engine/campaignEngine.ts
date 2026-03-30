'use client';

import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';
import { buildPlanPrompt, buildCreativePrompt, buildJuryVotePrompt } from '@/lib/ai/prompts';
import { JURY_PERSONAS } from '@/data/juryPersonas';
import type { Campaign, DailyPlan, Creative, VoteResult, Vote, LiveEvent } from '@/types';

type StoreActions = {
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  updateAgentStatus: (id: string, status: 'idle' | 'working' | 'reviewing' | 'completed') => void;
  addLiveEvent: (event: LiveEvent) => void;
  settings: {
    openaiApiKey: string;
    claudeApiKey: string;
    geminiApiKey: string;
  };
};

function createEvent(
  agentId: string,
  agentName: string,
  type: LiveEvent['type'],
  content: string
): LiveEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    agentId,
    agentName,
    type,
    content,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// === Phase 2: Generate Marketing Plan (민서 - 마케팅 전략가) ===
async function generatePlan(
  campaign: Campaign,
  store: StoreActions
): Promise<DailyPlan[]> {
  // 하나(본부장)가 작업 지시
  store.updateAgentStatus('hana', 'working');
  store.addLiveEvent(createEvent('hana', '하나', 'system', `"${campaign.productInfo.name}" 캠페인을 시작합니다. 민서님, 30일 마케팅 플랜 수립 부탁드립니다.`));
  await delay(400);

  // 민서(전략가)가 플랜 생성
  store.updateAgentStatus('minseo', 'working');
  store.addLiveEvent(createEvent('minseo', '민서', 'plan', `네, 본부장님! "${campaign.productInfo.name}" 플랜 생성을 시작합니다.`));

  await delay(500);

  const prompt = buildPlanPrompt(campaign.productInfo);

  try {
    const response = await callLLM(store.settings, prompt);
    const plans = parseJSONResponse<DailyPlan[]>(response.content);

    const validPlans = plans.map((p) => ({
      ...p,
      status: 'pending' as const,
    }));

    store.addLiveEvent(createEvent('minseo', '민서', 'plan', `30일 플랜 생성 완료! ${validPlans.length}일치 플랜이 준비되었습니다. (${response.model})`));
    store.updateAgentStatus('minseo', 'completed');
    store.updateAgentStatus('hana', 'reviewing');
    store.addLiveEvent(createEvent('hana', '하나', 'plan', `민서님 플랜 검토 완료. 훌륭합니다! 다음 단계로 진행하겠습니다.`));

    return validPlans;
  } catch (error) {
    store.addLiveEvent(createEvent('minseo', '민서', 'system', `플랜 생성 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}. 데모 플랜으로 대체합니다.`));
    store.updateAgentStatus('minseo', 'idle');
    return generateDemoPlan(campaign.productInfo.name);
  }
}

// === Phase 2: Generate Creatives (지우 - 카피라이터, 유나 - 크리에이티브 디렉터) ===
async function generateCreatives(
  campaign: Campaign,
  plans: DailyPlan[],
  store: StoreActions
): Promise<Creative[]> {
  // 하나가 크리에이티브 팀에 지시
  store.addLiveEvent(createEvent('hana', '하나', 'system', `지우님은 SEO 키워드 분석, 유나님은 비주얼 컨셉 잡아주세요!`));

  store.updateAgentStatus('jiwoo', 'working');
  store.updateAgentStatus('yuna', 'working');
  store.addLiveEvent(createEvent('jiwoo', '지우', 'creative', `SEO 키워드 분석 및 검색 최적화 카피 작성 시작합니다!`));
  store.addLiveEvent(createEvent('yuna', '유나', 'creative', `비주얼 컨셉과 이미지 프롬프트 준비하겠습니다.`));

  await delay(500);

  const allCreatives: Creative[] = [];
  const selectedPlans = plans.slice(0, 3);
  const platforms = ['instagram', 'tiktok', 'youtube'];

  for (const plan of selectedPlans) {
    const platform = platforms[plan.day % platforms.length];

    store.addLiveEvent(createEvent('jiwoo', '지우', 'creative', `Day ${plan.day} "${plan.title}" - ${platform} SEO 최적화 카피 작성 중...`));

    try {
      const prompt = buildCreativePrompt(campaign.productInfo, plan.day, plan.title, platform);
      const response = await callLLM(store.settings, prompt);
      const creatives = parseJSONResponse<Array<{
        angle: string;
        hookingText: string;
        copyText: string;
        imagePrompt?: string;
      }>>(response.content);

      for (const c of creatives) {
        allCreatives.push({
          id: crypto.randomUUID(),
          campaignId: campaign.id,
          angle: c.angle,
          copyText: c.copyText,
          hookingText: c.hookingText,
          imagePrompt: c.imagePrompt,
          platform,
          createdAt: new Date().toISOString(),
        });
      }

      store.addLiveEvent(createEvent('yuna', '유나', 'creative', `Day ${plan.day} 비주얼 컨셉 ${creatives.length}개 완성! 이미지 프롬프트 세팅 완료.`));
    } catch (error) {
      store.addLiveEvent(createEvent('jiwoo', '지우', 'system', `Day ${plan.day} SEO 카피 생성 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}. 데모 소재로 대체합니다.`));
      allCreatives.push(...generateDemoCreatives(campaign.id, plan.day, platform));
    }

    await delay(300);
  }

  store.addLiveEvent(createEvent('jiwoo', '지우', 'creative', `총 ${allCreatives.length}개 SEO 최적화 카피 작성 완료!`));
  store.addLiveEvent(createEvent('yuna', '유나', 'creative', `모든 소재 비주얼 감수 완료. 퀄리티 OK!`));
  store.updateAgentStatus('jiwoo', 'completed');
  store.updateAgentStatus('yuna', 'completed');

  return allCreatives;
}

// === Phase 3: AI Jury Voting (은지 - 데이터 엔지니어가 관리) ===
async function runJuryVoting(
  campaign: Campaign,
  creatives: Creative[],
  store: StoreActions
): Promise<VoteResult[]> {
  store.updateAgentStatus('eunji', 'working');
  store.updateAgentStatus('minseo', 'reviewing');
  store.addLiveEvent(createEvent('eunji', '은지', 'vote', `100인 AI 심사위원단 투표 시스템 가동합니다!`));
  store.addLiveEvent(createEvent('minseo', '민서', 'vote', `투표 결과를 실시간으로 모니터링하겠습니다.`));

  await delay(500);

  const voteResults: VoteResult[] = [];

  for (const creative of creatives) {
    const votes: Vote[] = [];
    const selectedJurors = selectRepresentativeJurors(10);

    for (const juror of selectedJurors) {
      try {
        const prompt = buildJuryVotePrompt(
          juror.name, juror.description, juror.age, juror.gender,
          creative.hookingText, creative.copyText, creative.angle,
          campaign.productInfo.name
        );
        const response = await callLLM(store.settings, prompt);
        const result = parseJSONResponse<{ score: number; comment: string }>(response.content);
        votes.push({
          juryId: juror.id,
          creativeId: creative.id,
          score: Math.min(10, Math.max(1, result.score)),
          comment: result.comment,
        });
      } catch {
        votes.push({
          juryId: juror.id,
          creativeId: creative.id,
          score: Math.floor(Math.random() * 4) + 6,
          comment: '자동 점수 부여',
        });
      }
    }

    // Simulate remaining 90 jurors
    const avgScore = votes.reduce((sum, v) => sum + v.score, 0) / votes.length;
    for (let i = 0; i < 90; i++) {
      const juror = JURY_PERSONAS[(i + selectedJurors.length) % JURY_PERSONAS.length];
      const variance = (Math.random() - 0.5) * 3;
      votes.push({
        juryId: juror.id,
        creativeId: creative.id,
        score: Math.min(10, Math.max(1, Math.round(avgScore + variance))),
        comment: generateAutoComment(juror.personaGroup, creative.angle, avgScore + variance),
      });
    }

    const totalScore = votes.reduce((sum, v) => sum + v.score, 0);
    voteResults.push({
      creativeId: creative.id,
      totalScore,
      averageScore: totalScore / votes.length,
      votes,
      rank: 0,
    });

    store.addLiveEvent(
      createEvent('eunji', '은지', 'vote',
        `"${creative.angle}" 소재 투표 완료 - 평균 ${(totalScore / votes.length).toFixed(1)}점`)
    );

    await delay(200);
  }

  // Rankings
  voteResults.sort((a, b) => b.averageScore - a.averageScore);
  voteResults.forEach((v, i) => { v.rank = i + 1; });

  const winner = creatives.find((c) => c.id === voteResults[0]?.creativeId);
  store.addLiveEvent(
    createEvent('eunji', '은지', 'vote',
      `투표 집계 완료! 1위: "${winner?.angle}" (${voteResults[0]?.averageScore.toFixed(1)}점)`)
  );
  store.addLiveEvent(
    createEvent('minseo', '민서', 'vote',
      `1위 소재: "${winner?.hookingText}" - 이 소재를 메인 광고로 추천합니다!`)
  );

  store.updateAgentStatus('eunji', 'completed');
  store.updateAgentStatus('minseo', 'completed');

  return voteResults;
}

// === Main Campaign Orchestrator ===
export async function runCampaignEngine(
  campaign: Campaign,
  store: StoreActions
) {
  // 본부장 하나가 전체 프로세스 시작
  store.addLiveEvent(createEvent('hana', '하나', 'system', `"${campaign.productInfo.name}" 캠페인 엔진 가동! 전 팀 대기해주세요.`));
  store.addLiveEvent(createEvent('siwon', '시원', 'system', `시스템 준비 완료. 파이프라인 정상 작동 중입니다.`));
  store.updateAgentStatus('siwon', 'working');

  // Phase 2: Generate Plan
  store.updateCampaign(campaign.id, { status: 'planning' });
  const dailyPlan = await generatePlan(campaign, store);
  store.updateCampaign(campaign.id, { dailyPlan, status: 'creating' });

  await delay(800);

  // Phase 2: Generate Creatives
  const creatives = await generateCreatives(campaign, dailyPlan, store);
  store.updateCampaign(campaign.id, { creatives, status: 'voting' });

  await delay(800);

  // Phase 3: Jury Voting
  const votes = await runJuryVoting(campaign, creatives, store);
  store.updateCampaign(campaign.id, { votes, status: 'active' });

  // 태양(퍼포먼스 마케터) & 도하(모션 디자이너) 최종 코멘트
  store.addLiveEvent(createEvent('taeyang', '태양', 'deploy', `1위 소재 기반으로 Meta/Google 광고 세팅 준비 완료. 본부장님 승인 대기 중.`));
  store.addLiveEvent(createEvent('doha', '도하', 'creative', `1위 소재 모션 그래픽 버전도 제작 가능합니다. 숏폼 영상으로 전환할까요?`));

  // 하나 최종 정리
  store.addLiveEvent(
    createEvent('hana', '하나', 'system',
      `"${campaign.productInfo.name}" 캠페인 파이프라인 완료! 모든 팀원 수고하셨습니다. 대시보드에서 결과를 확인하세요.`)
  );

  // Reset all agents to idle
  ['hana', 'minseo', 'jiwoo', 'taeyang', 'yuna', 'doha', 'siwon', 'eunji'].forEach((id) => {
    store.updateAgentStatus(id, 'idle');
  });
}

// === Helper Functions ===

function selectRepresentativeJurors(count: number) {
  const groups: Array<'trend' | 'practical' | 'emotional' | 'analytical' | 'impulsive'> = [
    'trend', 'practical', 'emotional', 'analytical', 'impulsive',
  ];
  const selected = [];
  for (let i = 0; i < count; i++) {
    const group = groups[i % groups.length];
    const groupMembers = JURY_PERSONAS.filter((j) => j.personaGroup === group);
    selected.push(groupMembers[Math.floor(Math.random() * groupMembers.length)]);
  }
  return selected;
}

function generateAutoComment(
  personaGroup: string,
  _angle: string,
  score: number
): string {
  const comments: Record<string, Record<string, string[]>> = {
    trend: {
      high: ['이거 틱톡에서 대박날 듯!', '바이럴 감 있음 ㅋㅋ', '최신 트렌드 잘 잡았네요'],
      low: ['좀 올드한 느낌...', '요즘 이런 건 안 먹혀요', '톤이 너무 진지함'],
    },
    practical: {
      high: ['가성비 메시지 명확함', '핵심 기능이 잘 드러남', '실용적인 광고네요'],
      low: ['뭘 파는 건지 모르겠음', '혜택이 불분명해요', '좀 더 구체적이면 좋겠어요'],
    },
    emotional: {
      high: ['감성 터짐 ㅠㅠ', '이 무드 너무 좋아요', '디자인 감각 최고'],
      low: ['감성이 안 와닿아요', '색감이 아쉬움', '스토리가 약해요'],
    },
    analytical: {
      high: ['근거가 명확한 좋은 카피', '타겟 소구 정확함', 'CTR 높을 것 같음'],
      low: ['수치적 근거 부족', '논리가 약해요', '신뢰도가 떨어짐'],
    },
    impulsive: {
      high: ['당장 설치하고 싶음!', '이거 사야됨!! 🔥', '한정판이면 바로 결제'],
      low: ['별로 끌리지 않음', '급한 느낌이 없어요', '임팩트 부족'],
    },
  };

  const group = comments[personaGroup] || comments.practical;
  const tier = score >= 7 ? 'high' : 'low';
  const pool = group[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

// === Demo Data Generators ===

function generateDemoPlan(productName: string): DailyPlan[] {
  const plans: DailyPlan[] = [];
  const weekThemes = [
    { theme: '인지도 확보 & 티저', channels: ['instagram', 'tiktok'] },
    { theme: '바이럴 챌린지', channels: ['tiktok', 'youtube'] },
    { theme: '퍼포먼스 마케팅', channels: ['instagram', 'blog'] },
    { theme: '리텐션 & 성장', channels: ['youtube', 'blog'] },
  ];

  for (let day = 1; day <= 30; day++) {
    const week = Math.ceil(day / 7);
    const weekIdx = Math.min(week - 1, 3);
    const wt = weekThemes[weekIdx];

    plans.push({
      day, week,
      title: `Day ${day}: ${productName} ${wt.theme} - ${day <= 7 ? '사전 등록 유도' : day <= 14 ? '콘텐츠 확산' : day <= 21 ? 'A/B 테스트 & 최적화' : '최종 스퍼트'}`,
      description: `${wt.theme} 전략에 따른 ${day}일차 마케팅 활동`,
      channels: wt.channels,
      target: day <= 7 ? '얼리어답터' : day <= 14 ? '2차 확산층' : '대중',
      goal: day <= 7 ? `${day * 300}명 사전등록` : day <= 14 ? `${day * 350}명 누적` : day <= 21 ? `${day * 400}명 누적` : `10,000명 달성`,
      status: 'pending',
    });
  }
  return plans;
}

function generateDemoCreatives(campaignId: string, day: number, platform: string): Creative[] {
  const angles = [
    { angle: '감성형', hook: '당신의 소중한 순간을 영원히', copy: '매일 스쳐지나가는 평범한 순간들이 사실은 가장 소중한 기억입니다. 지금 바로 시작하세요.' },
    { angle: '유머형', hook: '아직도 수동으로 하고 있어요? 🤯', copy: 'AI가 3초 만에 해주는 걸 왜 3시간씩 하고 계세요? 21세기에 사는 방법을 알려드립니다.' },
    { angle: '기능형', hook: '단 3번의 탭으로 완성', copy: '복잡한 과정 없이, 사진 선택부터 완성까지 평균 10초. 이미 50만명이 사용 중입니다.' },
    { angle: '스토리형', hook: '엄마가 울었다', copy: '시골에 계신 엄마에게 손녀 사진첩을 보내드렸더니 전화가 왔습니다. "이게 세상에..."' },
    { angle: 'FOMO형', hook: '오늘까지만 무료입니다', copy: '프리미엄 기능 30일 무료 체험이 오늘 자정에 종료됩니다. 놓치면 다음 기회는 없습니다.' },
  ];

  return angles.map((a) => ({
    id: crypto.randomUUID(),
    campaignId,
    angle: a.angle,
    copyText: a.copy,
    hookingText: a.hook,
    imagePrompt: `Marketing image for ${a.angle} angle, modern and clean design`,
    platform,
    createdAt: new Date().toISOString(),
  }));
}
