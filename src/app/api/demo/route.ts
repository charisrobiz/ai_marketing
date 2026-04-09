import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// POST: 데모 캠페인 생성 (SNAPTALE 시뮬레이션)
export async function POST() {
  const campaignId = crypto.randomUUID();
  const productInfo = {
    category: 'mobile_app',
    name: 'SNAPTALE',
    description: 'AI가 자동으로 사진을 포토북으로 만들어주는 앱',
    targetAudience: '자녀를 가진 20~40대 부모, 사진 정리를 귀찮아하는 사람',
    uniqueValue: '사진 선택만 하면 AI가 3초 만에 포토북 완성, PDF 추출 가능',
    additionalAnswers: {},
  };

  // 1. 캠페인 생성
  await supabase.from('campaigns').insert({ id: campaignId, campaign_mode: 'demo', product_info: productInfo, status: 'active' });

  // 2. 30일 플랜 생성
  const plans = [
    { day: 1, week: 1, title: '니치 발견: 핵심 페르소나 설정', desc: '극도의 세분화 - "매일 아이 사진은 찍지만 정리 못하는 워킹맘/대디"를 핵심 니치로 설정', channels: ['instagram'], target: '사진 정리 못하는 워킹맘', goal: '니치 페르소나 확정' },
    { day: 2, week: 1, title: '니치 커뮤니티 시딩: 육아 커뮤니티 잠입', desc: '맘카페, 육아 인스타 해시태그 분석', channels: ['instagram', 'blog'], target: '육아 커뮤니티 활성 유저', goal: '니치 해시태그 50개 발굴' },
    { day: 3, week: 1, title: '얼리어답터 확보: 마이크로 인플루언서 접촉', desc: '팔로워 1K-10K 육아 인스타그래머 20명에게 무료 체험 제안', channels: ['instagram'], target: '육아 마이크로 인플루언서', goal: '인플루언서 10명 확보' },
    { day: 5, week: 1, title: '티저 콘텐츠: "3초의 기적" 릴스', desc: '사진 100장 → 3초 만에 포토북 완성되는 과정을 타임랩스로 촬영', channels: ['instagram', 'tiktok'], target: '사진 많은 부모', goal: '릴스 조회수 10K' },
    { day: 7, week: 1, title: '권위 구축: 육아 포토북 완벽 가이드 블로그', desc: '"아이 첫 돌 포토북 만들기" SEO 롱테일 키워드 공략', channels: ['blog'], target: '첫돌 준비 부모', goal: '블로그 방문 500' },
    { day: 10, week: 2, title: '바이럴 챌린지: #3초포토북챌린지', desc: 'UGC 유도', channels: ['instagram', 'tiktok'], target: '육아 인스타그래머', goal: 'UGC 50개 생성' },
    { day: 14, week: 2, title: '커뮤니티 결속: 맘카페 체험단 모집', desc: '30명 체험단 모집', channels: ['blog'], target: '맘카페 활성 유저', goal: '체험 후기 30개' },
    { day: 17, week: 3, title: 'A/B 테스트: 감성 vs 기능 소구', desc: '광고 테스트', channels: ['instagram'], target: '니치 타겟 리타겟팅', goal: 'CTR 3% 이상' },
    { day: 21, week: 3, title: '퍼포먼스 스케일링: 위너 소재 집중', desc: '위너 소재에 예산 80% 집중', channels: ['instagram', 'tiktok'], target: '핵심 니치 + 인접 니치', goal: '설치 5,000명' },
    { day: 25, week: 4, title: '볼링핀 확장: 반려동물 니치로 확장', desc: '인접 니치 확장', channels: ['instagram', 'tiktok'], target: '반려동물 양육자', goal: '신규 니치 진입' },
    { day: 30, week: 4, title: '리텐션 강화: 월간 포토북 구독 유도', desc: '구독 전환', channels: ['instagram', 'blog'], target: '기존 설치 유저', goal: '10,000명 달성' },
  ];

  await supabase.from('daily_plans').insert(plans.map((p) => ({
    campaign_id: campaignId, day: p.day, week: p.week, title: p.title,
    description: p.desc, channels: JSON.stringify(p.channels), target: p.target, goal: p.goal, status: 'completed',
  })));

  // 3. 크리에이티브 소재
  const creatives = [
    { angle: '공감형', hook: '육아맘만 아는 이 고통', copy: '갤러리에 아이 사진 3만장... 정리는 언제 하지? 같은 고민이라면 우리가 답이에요.', platform: 'instagram', imgPrompt: 'Overwhelmed parent surrounded by baby photos' },
    { angle: '권위형', hook: '10만 가정이 선택한 이유', copy: 'AI가 아이 사진을 발달 단계별로 자동 분류. 성장 기록의 정석.', platform: 'instagram', imgPrompt: 'Professional baby photo album' },
    { angle: 'UGC유도형', hook: '#3초포토북챌린지 도전!', copy: '사진 10장 골라서 넣으면 끝! 3초 만에 완성된 포토북 Before/After 공유하기', platform: 'instagram', imgPrompt: 'Split screen before/after' },
    { angle: '바이럴형', hook: '이거 진짜 3초 만에 됨', copy: '직접 써봤는데... 와 진짜 사진 고르고 3초면 포토북 나옴 ㅋㅋㅋ', platform: 'instagram', imgPrompt: 'Casual selfie showing phone' },
    { angle: '긴급형', hook: '오늘까지만 무료입니다', copy: '첫돌 포토북 무료 이벤트 D-1. 프리미엄 테마 10종 + PDF 추출 무료.', platform: 'instagram', imgPrompt: 'Countdown timer with urgency' },
    { angle: '공감형', hook: '아이 사진 몇장이세요?', copy: '저는 27,483장이요... 그 중 정리한 건 0장. 같은 분 손들어주세요 🙋‍♀️', platform: 'tiktok', imgPrompt: 'Viral TikTok style' },
    { angle: 'UGC유도형', hook: '3초 포토북 만들기 도전', copy: '이 영상 보고 따라하면 됩니다!', platform: 'tiktok', imgPrompt: 'Step by step tutorial' },
    { angle: '바이럴형', hook: '시어머니가 울었습니다', copy: '내돈내산 후기. 손주 포토북 만들어드렸더니 전화가 왔어요.', platform: 'tiktok', imgPrompt: 'Emotional reaction' },
    { angle: '권위형', hook: '아이 성장 기록, 이렇게 하세요', copy: '소아과 전문의도 추천하는 성장 기록법.', platform: 'youtube', imgPrompt: 'Professional YouTube thumbnail' },
    { angle: '긴급형', hook: '이 앱 알면 인생이 바뀝니다', copy: '3만장 사진 정리를 3초 만에? 100만 부모가 선택한 이유.', platform: 'youtube', imgPrompt: 'Clickbait YouTube thumbnail' },
    { angle: '권위형', hook: '2026 최고의 육아 앱 TOP 5', copy: 'AI 기술로 육아가 편해지는 시대. 스마트한 부모들이 선택한 앱 분석.', platform: 'blog', imgPrompt: 'Clean infographic' },
    { angle: '공감형', hook: '워킹맘의 사진 정리 꿀팁 대방출', copy: '출근 전 5분, 퇴근 후 5분이면 충분합니다.', platform: 'blog', imgPrompt: 'Warm lifestyle blog header' },
  ];

  const creativeIds: string[] = [];
  const creativeRows = creatives.map((c) => {
    const cId = crypto.randomUUID();
    creativeIds.push(cId);
    return { id: cId, campaign_id: campaignId, angle: c.angle, copy_text: c.copy, hooking_text: c.hook, image_prompt: c.imgPrompt, platform: c.platform };
  });
  await supabase.from('creatives').insert(creativeRows);

  // 4. 투표 결과
  const voteComments = ['이거 보고 바로 설치했을 듯', '공감 100%', '카피가 직관적', 'SNS에 공유하고 싶음', '진정성 있는 톤', '타겟 정확', 'UGC로 퍼질 소재', '클릭하고 싶어지는 후킹', '신뢰가 가는 카피', '재미있어서 끝까지 봤음', '임팩트 있는 비주얼', '가성비 메시지 명확'];
  const voteRows: Array<Record<string, unknown>> = [];
  for (const cId of creativeIds) {
    for (let j = 1; j <= 100; j++) {
      voteRows.push({ campaign_id: campaignId, creative_id: cId, jury_id: j, score: Math.floor(Math.random() * 4) + 6, comment: voteComments[Math.floor(Math.random() * voteComments.length)] });
    }
  }
  // Insert votes in chunks (Supabase has row limits)
  for (let i = 0; i < voteRows.length; i += 500) {
    await supabase.from('votes').insert(voteRows.slice(i, i + 500));
  }

  // 5. 라이브 이벤트
  const events = [
    ['hana', '하나', 'chat', '팀 여러분, "SNAPTALE" 캠페인 킥오프 미팅 시작합니다.'],
    ['hana', '하나', 'chat', '예산은 한정적이에요. 최소 비용으로 최대 효과를 내는 전략 조합을 찾아야 합니다.'],
    ['minseo', '민서', 'chat', '"20~40대 부모"는 너무 넓습니다. "아이 사진 정리 못하는 워킹맘"으로 좁혀서 니치 마케팅으로 시작하죠.'],
    ['taeyang', '태양', 'chat', '니치만으로는 1만 명이 힘들어요. Week 3부터는 퍼포먼스 광고로 확장해야 합니다.'],
    ['minseo', '민서', 'chat', 'Week 1-2는 니치+바이럴, Week 3부터 퍼포먼스 스케일업 하이브리드 전략은 어떨까요?'],
    ['jiwoo', '지우', 'chat', 'SEO 관점에서 "아기 포토북 만들기" 롱테일 키워드가 경쟁이 낮아요.'],
    ['yuna', '유나', 'chat', '스톡 이미지 대신 리얼한 감성이 클릭률을 2배 이상 올립니다.'],
    ['doha', '도하', 'chat', '틱톡 Before/After 포맷으로 바이럴 가능성 높습니다.'],
    ['eunji', '은지', 'chat', 'UGC 기반으로 CAC를 500원대까지 내릴 수 있어요.'],
    ['siwon', '시원', 'chat', '딥링크 + 레퍼럴 코드로 바이럴 경로 추적 가능합니다.'],
    ['hana', '하나', 'system', '[전략 결정] Week 1-2: 니치+바이럴+SEO / Week 3-4: 퍼포먼스 스케일업. 예상 CAC: 500~800원.'],
    ['minseo', '민서', 'plan', '30일 플랜 초안 완성. Week 1 예산 0원(무료 체험 인플루언서).'],
    ['jiwoo', '지우', 'creative', 'SEO 키워드 리서치 완료. 카피 12개 초안 완성!'],
    ['yuna', '유나', 'creative', '앵글별 비주얼 톤 분리 완료. 리얼 목업 기반으로 감수.'],
    ['hana', '하나', 'system', 'SNAPTALE 캠페인 전략 수립 완료!'],
  ];

  const now = Date.now();
  const eventRows = events.map((e, i) => ({
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    agent_id: e[0],
    agent_name: e[1],
    type: e[2],
    content: e[3],
    created_at: new Date(now - (events.length - i) * 60000).toISOString(),
  }));
  await supabase.from('live_events').insert(eventRows);

  // 6. 작업 목록
  const tasks = [
    ['minseo', '민서', '30일 하이브리드 마케팅 플랜', '니치+바이럴+퍼포먼스 복합 전략', 'completed', '11일치 핵심 플랜 완료'],
    ['jiwoo', '지우', 'SEO 키워드 분석 & 카피 12종', '롱테일 키워드 + 카피라이팅', 'completed', '12개 카피 완료'],
    ['yuna', '유나', '플랫폼별 비주얼 컨셉', '앵글별 톤 분리, 비주얼 가이드', 'completed', '12개 비주얼 감수'],
    ['doha', '도하', 'Before/After 숏폼 영상 제작', '3초 전환 효과 모션', 'completed', '숏폼 3종 완료'],
    ['taeyang', '태양', '퍼포먼스 광고 세팅', '25-34세 우선 타겟', 'completed', 'CPA 700원 목표 세팅'],
    ['eunji', '은지', '경쟁사 분석 & 투표 분석', 'CPA 벤치마크, 투표 집계', 'completed', '공감형 1위 확인'],
    ['siwon', '시원', '레퍼럴 시스템 구축', '딥링크+초대코드', 'completed', 'K-Factor 추적 시스템 완료'],
  ];
  const taskRows = tasks.map((t) => ({
    id: crypto.randomUUID(), campaign_id: campaignId, agent_id: t[0], agent_name: t[1],
    title: t[2], description: t[3], status: t[4], result: t[5], completed_at: new Date().toISOString(),
  }));
  await supabase.from('agent_tasks').insert(taskRows);

  return NextResponse.json({ campaignId, status: 'demo_created' });
}
