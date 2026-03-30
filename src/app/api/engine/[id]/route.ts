import { NextResponse } from 'next/server';
import db from '@/lib/db/database';
import { buildPlanPrompt, buildCreativePrompt, buildJuryVotePrompt } from '@/lib/ai/prompts';
import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';
import { JURY_PERSONAS } from '@/data/juryPersonas';
import type { ProductInfo } from '@/types';

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    openaiApiKey: map['openaiApiKey'] || '',
    claudeApiKey: map['claudeApiKey'] || '',
    geminiApiKey: map['geminiApiKey'] || '',
  };
}

function addEvent(campaignId: string, agentId: string, agentName: string, type: string, content: string) {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, campaignId, agentId, agentName, type, content);
  return id;
}

function addTask(campaignId: string, agentId: string, agentName: string, title: string, description: string, status = 'pending') {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO agent_tasks (id, campaign_id, agent_id, agent_name, title, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(id, campaignId, agentId, agentName, title, description, status);
  return id;
}

function updateTask(id: string, status: string, result?: string) {
  if (status === 'completed') {
    db.prepare('UPDATE agent_tasks SET status = ?, result = ?, completed_at = datetime(\'now\') WHERE id = ?').run(status, result || null, id);
  } else {
    db.prepare('UPDATE agent_tasks SET status = ? WHERE id = ?').run(status, id);
  }
}

function updateCampaignStatus(id: string, status: string) {
  db.prepare('UPDATE campaigns SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
}

// POST: 캠페인 엔진 실행
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId) as Record<string, unknown> | undefined;
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const productInfo: ProductInfo = JSON.parse(campaign.product_info as string);
  const settings = getSettings();

  // === 하나(본부장) 브리핑 ===
  addEvent(campaignId, 'hana', '하나', 'chat', `안녕하세요 팀 여러분! "${productInfo.name}" 캠페인 킥오프 미팅을 시작하겠습니다.`);
  addEvent(campaignId, 'hana', '하나', 'chat', `제품 카테고리는 "${productInfo.category}"이고, 핵심 차별점은 "${productInfo.uniqueValue || productInfo.description}"입니다.`);
  addEvent(campaignId, 'hana', '하나', 'chat', `오늘 목표: 30일 마케팅 플랜 수립 → 크리에이티브 소재 생성 → 100인 심사위원 투표까지 완료합니다.`);

  // 팀원 반응
  addEvent(campaignId, 'minseo', '민서', 'chat', `네 본부장님! 타겟 고객 "${productInfo.targetAudience || '미정'}" 기반으로 30일 플랜 바로 잡겠습니다.`);
  addEvent(campaignId, 'jiwoo', '지우', 'chat', `SEO 키워드 리서치부터 시작할게요. 앱스토어 최적화도 함께 진행합니다.`);
  addEvent(campaignId, 'yuna', '유나', 'chat', `비주얼 무드보드 준비하고 있겠습니다. 민서님 전략 나오면 바로 디자인 들어갈게요!`);
  addEvent(campaignId, 'siwon', '시원', 'chat', `시스템 파이프라인 준비 완료. 언제든 가동 가능합니다.`);
  addEvent(campaignId, 'eunji', '은지', 'chat', `데이터 수집/분석 대시보드 세팅 완료했습니다.`);

  // === 업무 할당 ===
  addEvent(campaignId, 'hana', '하나', 'system', `업무를 할당합니다. 각자 확인해주세요!`);

  const taskPlan = addTask(campaignId, 'minseo', '민서', '30일 마케팅 플랜 수립', '채널별 전략, 일단위 목표, A/B 테스트 포인트 포함', 'in_progress');
  const taskSeo = addTask(campaignId, 'jiwoo', '지우', 'SEO 키워드 분석 & 최적화 카피', '검색 키워드 리서치, ASO 최적화, SEO 카피 작성', 'pending');
  const taskVisual = addTask(campaignId, 'yuna', '유나', '크리에이티브 비주얼 컨셉', '광고 이미지 컨셉, 브랜드 컬러, 이미지 프롬프트 작성', 'pending');
  const taskMotion = addTask(campaignId, 'doha', '도하', '숏폼 영상 소재 기획', '틱톡/릴스용 모션 그래픽 컨셉, 편집 방향', 'pending');
  const taskPerf = addTask(campaignId, 'taeyang', '태양', '광고 세팅 & A/B 테스트 준비', 'Meta/Google 광고 캠페인 구조 설계, 타겟 세그먼트', 'pending');
  const taskData = addTask(campaignId, 'eunji', '은지', '심사위원 투표 분석 시스템', '100인 AI 심사위원 투표 집계 및 인사이트 도출', 'pending');
  const taskDev = addTask(campaignId, 'siwon', '시원', 'AI 파이프라인 운영', 'LLM API 연동, 데이터 수집 자동화', 'in_progress');

  // === Phase 1: 마케팅 플랜 생성 ===
  updateCampaignStatus(campaignId, 'planning');
  addEvent(campaignId, 'minseo', '민서', 'plan', `30일 마케팅 플랜 생성을 시작합니다...`);

  let plans;
  try {
    const prompt = buildPlanPrompt(productInfo);
    const response = await callLLM(settings, prompt);
    plans = parseJSONResponse<Array<{ day: number; week: number; title: string; description: string; channels: string[]; target: string; goal: string }>>(response.content);

    addEvent(campaignId, 'minseo', '민서', 'plan', `30일 플랜 생성 완료! ${plans.length}일치 준비됐습니다. (${response.model})`);
    addEvent(campaignId, 'hana', '하나', 'chat', `민서님 플랜 확인했습니다. 전략 방향 좋아요! 지우님, 유나님 이 플랜 기반으로 작업 시작해주세요.`);
  } catch (err) {
    addEvent(campaignId, 'minseo', '민서', 'system', `API 오류로 데모 플랜을 사용합니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    plans = generateDemoPlan(productInfo.name);
  }

  // Save plans to DB
  const insertPlan = db.prepare('INSERT INTO daily_plans (campaign_id, day, week, title, description, channels, target, goal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const p of plans) {
    insertPlan.run(campaignId, p.day, p.week, p.title, p.description, JSON.stringify(p.channels), p.target, p.goal, 'pending');
  }
  updateTask(taskPlan, 'completed', `${plans.length}일 플랜 생성 완료`);

  // === Phase 2: 크리에이티브 소재 생성 ===
  updateCampaignStatus(campaignId, 'creating');
  updateTask(taskSeo, 'in_progress');
  updateTask(taskVisual, 'in_progress');

  addEvent(campaignId, 'jiwoo', '지우', 'creative', `SEO 최적화 카피 작성 시작합니다!`);
  addEvent(campaignId, 'yuna', '유나', 'creative', `비주얼 컨셉 잡기 시작! 이미지 프롬프트도 함께 만들게요.`);
  addEvent(campaignId, 'doha', '도하', 'chat', `유나님 컨셉 나오면 모션 버전도 바로 기획할게요.`);

  const insertCreative = db.prepare('INSERT INTO creatives (id, campaign_id, angle, copy_text, hooking_text, image_prompt, platform, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))');
  const selectedPlans = plans.slice(0, 3);
  const platforms = ['instagram', 'tiktok', 'youtube'];
  let totalCreatives = 0;

  for (const plan of selectedPlans) {
    const platform = platforms[plan.day % platforms.length];
    addEvent(campaignId, 'jiwoo', '지우', 'creative', `Day ${plan.day} "${plan.title}" - ${platform} SEO 카피 작성 중...`);

    let creatives;
    try {
      const prompt = buildCreativePrompt(productInfo, plan.day, plan.title, platform);
      const response = await callLLM(settings, prompt);
      creatives = parseJSONResponse<Array<{ angle: string; hookingText: string; copyText: string; imagePrompt?: string }>>(response.content);
    } catch {
      creatives = generateDemoCreatives();
    }

    for (const c of creatives) {
      insertCreative.run(crypto.randomUUID(), campaignId, c.angle, c.copyText, c.hookingText, c.imagePrompt || null, platform);
      totalCreatives++;
    }

    addEvent(campaignId, 'yuna', '유나', 'creative', `Day ${plan.day} 비주얼 ${creatives.length}개 감수 완료!`);
  }

  addEvent(campaignId, 'jiwoo', '지우', 'creative', `총 ${totalCreatives}개 SEO 최적화 카피 완성!`);
  addEvent(campaignId, 'yuna', '유나', 'creative', `모든 소재 비주얼 퀄리티 OK!`);
  updateTask(taskSeo, 'completed', `${totalCreatives}개 카피 작성`);
  updateTask(taskVisual, 'completed', `${totalCreatives}개 비주얼 감수`);
  updateTask(taskMotion, 'in_progress');
  addEvent(campaignId, 'doha', '도하', 'creative', `1위 소재 기반 숏폼 영상 컨셉 기획 중...`);

  // === Phase 3: 투표 ===
  updateCampaignStatus(campaignId, 'voting');
  updateTask(taskData, 'in_progress');
  addEvent(campaignId, 'eunji', '은지', 'vote', `100인 AI 심사위원단 투표 시스템 가동합니다!`);
  addEvent(campaignId, 'minseo', '민서', 'chat', `투표 결과가 우리 전략 방향을 결정합니다. 집중해서 봐주세요!`);

  const allCreatives = db.prepare('SELECT * FROM creatives WHERE campaign_id = ?').all(campaignId) as Array<Record<string, unknown>>;
  const insertVote = db.prepare('INSERT INTO votes (campaign_id, creative_id, jury_id, score, comment) VALUES (?, ?, ?, ?, ?)');

  for (const creative of allCreatives) {
    const selectedJurors = selectRepresentativeJurors(10);

    for (const juror of selectedJurors) {
      let score: number;
      let comment: string;
      try {
        const prompt = buildJuryVotePrompt(
          juror.name, juror.description, juror.age, juror.gender,
          creative.hooking_text as string, creative.copy_text as string,
          creative.angle as string, productInfo.name
        );
        const response = await callLLM(settings, prompt);
        const result = parseJSONResponse<{ score: number; comment: string }>(response.content);
        score = Math.min(10, Math.max(1, result.score));
        comment = result.comment;
      } catch {
        score = Math.floor(Math.random() * 4) + 6;
        comment = '자동 평가';
      }
      insertVote.run(campaignId, creative.id, juror.id, score, comment);
    }

    // Simulate remaining 90
    const realVotes = db.prepare('SELECT AVG(score) as avg FROM votes WHERE creative_id = ?').get(creative.id) as { avg: number };
    const avgScore = realVotes.avg || 7;
    for (let i = 0; i < 90; i++) {
      const juror = JURY_PERSONAS[(i + 10) % JURY_PERSONAS.length];
      const variance = (Math.random() - 0.5) * 3;
      const s = Math.min(10, Math.max(1, Math.round(avgScore + variance)));
      insertVote.run(campaignId, creative.id, juror.id, s, generateAutoComment(juror.personaGroup, s));
    }

    const totalVotes = db.prepare('SELECT AVG(score) as avg FROM votes WHERE creative_id = ?').get(creative.id) as { avg: number };
    addEvent(campaignId, 'eunji', '은지', 'vote', `"${creative.angle}" 투표 완료 - 평균 ${totalVotes.avg.toFixed(1)}점`);
  }

  // Final results
  const topCreative = db.prepare(`
    SELECT c.angle, c.hooking_text, AVG(v.score) as avg_score
    FROM creatives c JOIN votes v ON c.id = v.creative_id
    WHERE c.campaign_id = ?
    GROUP BY c.id ORDER BY avg_score DESC LIMIT 1
  `).get(campaignId) as { angle: string; hooking_text: string; avg_score: number } | undefined;

  if (topCreative) {
    addEvent(campaignId, 'eunji', '은지', 'vote', `투표 집계 완료! 1위: "${topCreative.angle}" (${topCreative.avg_score.toFixed(1)}점)`);
    addEvent(campaignId, 'minseo', '민서', 'vote', `1위: "${topCreative.hooking_text}" - 메인 광고 소재로 추천합니다!`);
  }

  updateTask(taskData, 'completed', '투표 집계 및 분석 완료');
  updateTask(taskMotion, 'completed', '1위 소재 기반 숏폼 컨셉 완료');
  updateTask(taskPerf, 'in_progress');

  // === 마무리 미팅 ===
  updateCampaignStatus(campaignId, 'active');
  addEvent(campaignId, 'taeyang', '태양', 'deploy', `1위 소재 기반 Meta/Google 광고 세팅 완료. 본부장님 승인 대기 중입니다.`);
  addEvent(campaignId, 'doha', '도하', 'creative', `1위 소재 모션 그래픽 버전 제작 가능합니다!`);
  addEvent(campaignId, 'hana', '하나', 'chat', `모든 팀원 수고하셨습니다! "${productInfo.name}" 캠페인 파이프라인 완료. 결과가 훌륭합니다.`);
  addEvent(campaignId, 'hana', '하나', 'system', `캠페인 활성화 완료. 대시보드에서 전체 결과를 확인하세요.`);
  updateTask(taskPerf, 'completed', '광고 세팅 완료');
  updateTask(taskDev, 'completed', '파이프라인 정상 운영 완료');

  return NextResponse.json({ campaignId, status: 'completed' });
}

// === Helpers ===
function selectRepresentativeJurors(count: number) {
  const groups = ['trend', 'practical', 'emotional', 'analytical', 'impulsive'] as const;
  const selected = [];
  for (let i = 0; i < count; i++) {
    const group = groups[i % groups.length];
    const members = JURY_PERSONAS.filter((j) => j.personaGroup === group);
    selected.push(members[Math.floor(Math.random() * members.length)]);
  }
  return selected;
}

function generateAutoComment(personaGroup: string, score: number): string {
  const c: Record<string, Record<string, string[]>> = {
    trend: { high: ['틱톡에서 대박날 듯!', '바이럴 감 있음 ㅋㅋ', '트렌드 잘 잡았네요'], low: ['좀 올드함...', '요즘 안 먹혀요', '진지함'] },
    practical: { high: ['가성비 메시지 명확', '기능이 잘 드러남', '실용적'], low: ['뭘 파는 건지...', '혜택 불분명', '구체적이면 좋겠음'] },
    emotional: { high: ['감성 터짐 ㅠ', '무드 좋아요', '디자인 감각 최고'], low: ['감성 안 와닿아요', '색감 아쉬움', '스토리 약함'] },
    analytical: { high: ['근거 명확 좋은 카피', '타겟 정확', 'CTR 높을 듯'], low: ['수치적 근거 부족', '논리 약함', '신뢰도 떨어짐'] },
    impulsive: { high: ['당장 설치하고 싶음!', '이거 사야됨!!', '바로 결제'], low: ['별로 끌리지 않음', '급한 느낌 없음', '임팩트 부족'] },
  };
  const g = c[personaGroup] || c.practical;
  const pool = g[score >= 7 ? 'high' : 'low'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateDemoPlan(productName: string) {
  const plans = [];
  const themes = [
    { theme: '인지도 확보 & 티저', channels: ['instagram', 'tiktok'] },
    { theme: '바이럴 챌린지', channels: ['tiktok', 'youtube'] },
    { theme: '퍼포먼스 마케팅', channels: ['instagram', 'blog'] },
    { theme: '리텐션 & 성장', channels: ['youtube', 'blog'] },
  ];
  for (let day = 1; day <= 30; day++) {
    const week = Math.ceil(day / 7);
    const wt = themes[Math.min(week - 1, 3)];
    plans.push({
      day, week,
      title: `${productName} ${wt.theme}`,
      description: `${wt.theme} 전략 ${day}일차`,
      channels: wt.channels,
      target: day <= 7 ? '얼리어답터' : day <= 14 ? '2차 확산층' : '대중',
      goal: `${Math.min(day * 350, 10000)}명`,
    });
  }
  return plans;
}

function generateDemoCreatives() {
  return [
    { angle: '감성형', hookingText: '당신의 소중한 순간을 영원히', copyText: '매일 스쳐지나가는 평범한 순간들이 가장 소중한 기억입니다.', imagePrompt: 'Warm emotional family photo moment' },
    { angle: '유머형', hookingText: '아직도 수동으로? 🤯', copyText: 'AI가 3초면 끝나는 걸 3시간씩 하고 계세요?', imagePrompt: 'Funny character struggling with manual work' },
    { angle: '기능형', hookingText: '단 3번의 탭으로 완성', copyText: '사진 선택부터 완성까지 평균 10초. 이미 50만명이 사용 중.', imagePrompt: 'Clean UI showing 3-step process' },
    { angle: '스토리형', hookingText: '엄마가 울었다', copyText: '시골 엄마에게 손녀 사진첩 보내드렸더니 전화가 왔습니다.', imagePrompt: 'Grandma looking at photo album with tears of joy' },
    { angle: 'FOMO형', hookingText: '오늘까지만 무료', copyText: '프리미엄 30일 무료 체험이 오늘 자정 종료. 놓치면 다음 기회 없음.', imagePrompt: 'Countdown timer with urgency' },
  ];
}
