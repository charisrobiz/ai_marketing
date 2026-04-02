import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

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
  db.prepare('INSERT INTO campaigns (id, product_info, status, created_at) VALUES (?, ?, ?, datetime(\'now\'))').run(
    campaignId, JSON.stringify(productInfo), 'active'
  );

  // 2. 30일 플랜 생성 (니치밴딩 전략 기반)
  const plans = [
    { day: 1, week: 1, title: '니치 발견: 핵심 페르소나 설정', desc: '극도의 세분화 - "매일 아이 사진은 찍지만 정리 못하는 워킹맘/대디"를 핵심 니치로 설정', channels: ['instagram'], target: '사진 정리 못하는 워킹맘', goal: '니치 페르소나 확정' },
    { day: 2, week: 1, title: '니치 커뮤니티 시딩: 육아 커뮤니티 잠입', desc: '맘카페, 육아 인스타 해시태그 분석. #육아스타그램 #아기성장일기 니치 해시태그 발굴', channels: ['instagram', 'blog'], target: '육아 커뮤니티 활성 유저', goal: '니치 해시태그 50개 발굴' },
    { day: 3, week: 1, title: '얼리어답터 확보: 마이크로 인플루언서 접촉', desc: '팔로워 1K-10K 육아 인스타그래머 20명에게 무료 체험 제안', channels: ['instagram'], target: '육아 마이크로 인플루언서', goal: '인플루언서 10명 확보' },
    { day: 5, week: 1, title: '티저 콘텐츠: "3초의 기적" 릴스', desc: '사진 100장 → 3초 만에 포토북 완성되는 과정을 타임랩스로 촬영', channels: ['instagram', 'tiktok'], target: '사진 많은 부모', goal: '릴스 조회수 10K' },
    { day: 7, week: 1, title: '권위 구축: 육아 포토북 완벽 가이드 블로그', desc: '"아이 첫 돌 포토북 만들기" SEO 롱테일 키워드 공략', channels: ['blog'], target: '첫돌 준비 부모', goal: '블로그 방문 500' },
    { day: 10, week: 2, title: '바이럴 챌린지: #3초포토북챌린지', desc: 'UGC 유도 - 앱으로 포토북 만들고 Before/After 공유하는 챌린지', channels: ['instagram', 'tiktok'], target: '육아 인스타그래머', goal: 'UGC 50개 생성' },
    { day: 14, week: 2, title: '커뮤니티 결속: 맘카페 체험단 모집', desc: '니치 커뮤니티 내 30명 체험단 모집, 솔직 후기 작성 요청', channels: ['blog'], target: '맘카페 활성 유저', goal: '체험 후기 30개' },
    { day: 17, week: 3, title: 'A/B 테스트: 감성 vs 기능 소구', desc: '감성("우주에서 가장 짧은 15년") vs 기능("3초 만에 완성") 광고 테스트', channels: ['instagram'], target: '니치 타겟 리타겟팅', goal: 'CTR 3% 이상' },
    { day: 21, week: 3, title: '퍼포먼스 스케일링: 위너 소재 집중', desc: 'A/B 테스트 위너 소재에 예산 80% 집중. 니치 세그먼트 확장', channels: ['instagram', 'tiktok'], target: '핵심 니치 + 인접 니치', goal: '설치 5,000명' },
    { day: 25, week: 4, title: '볼링핀 확장: 반려동물 니치로 확장', desc: '육아 니치 장악 후 "반려동물 포토북" 인접 니치로 확장 시작', channels: ['instagram', 'tiktok'], target: '반려동물 양육자', goal: '신규 니치 진입' },
    { day: 30, week: 4, title: '리텐션 강화: 월간 포토북 구독 유도', desc: '기존 유저에게 "이달의 포토북" 자동 생성 푸시, 구독 전환', channels: ['instagram', 'blog'], target: '기존 설치 유저', goal: '10,000명 달성' },
  ];

  const insertPlan = db.prepare('INSERT INTO daily_plans (campaign_id, day, week, title, description, channels, target, goal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const p of plans) {
    insertPlan.run(campaignId, p.day, p.week, p.title, p.desc, JSON.stringify(p.channels), p.target, p.goal, 'completed');
  }

  // 3. 크리에이티브 소재 생성 (니치밴딩 앵글)
  const creatives = [
    // Instagram 소재
    { angle: '커뮤니티형', hook: '육아맘만 아는 이 고통', copy: '갤러리에 아이 사진 3만장... 정리는 언제 하지? 같은 고민이라면 우리가 답이에요. #육아맘공감 #사진정리꿀팁', platform: 'instagram', imgPrompt: 'Overwhelmed parent surrounded by thousands of cute baby photos, warm pastel colors, relatable humor style' },
    { angle: '권위형', hook: '육아 포토북 전문가가 알려주는', copy: '10만 가정이 선택한 AI 포토북. 발달 단계별 자동 분류, 전문 레이아웃. 아이 성장 기록의 정석.', platform: 'instagram', imgPrompt: 'Professional looking baby photo album with gold accents, expert badge, clean minimal design' },
    { angle: 'UGC유도형', hook: '#3초포토북챌린지 참여하세요', copy: '사진 10장 골라서 SNAPTALE에 넣으면 끝! 3초 만에 완성된 포토북 Before/After 공유하고 프리미엄 1년 무료 받기', platform: 'instagram', imgPrompt: 'Split screen before/after showing messy photo gallery vs beautiful photobook, challenge style graphic' },
    { angle: '마이크로인플루언서형', hook: '이거 진짜 3초 만에 됨', copy: '구독자분들이 계속 물어보셔서 직접 써봤는데... 와 진짜 사진 고르고 3초면 포토북 나옴. 속은 셈 치고 해보세요.', platform: 'instagram', imgPrompt: 'Casual selfie style photo of someone showing phone screen with photobook app, authentic feel' },
    { angle: 'FOMO형', hook: '오늘까지만 무료입니다', copy: '첫돌 포토북 무료 이벤트 D-1. 프리미엄 테마 10종 + PDF 추출 무료. 내일부터 정가 29,900원.', platform: 'instagram', imgPrompt: 'Countdown timer with urgency red accent, premium photobook preview, exclusive badge' },

    // TikTok 소재
    { angle: '커뮤니티형', hook: '아이 사진 몇장이세요?', copy: '저는 27,483장이요... 그 중 정리한 건 0장. 같은 분 손들어주세요 🙋‍♀️ (해결법 영상 끝까지 보세요)', platform: 'tiktok', imgPrompt: 'Viral TikTok style text overlay, surprised face, phone showing photo count' },
    { angle: 'UGC유도형', hook: '3초 포토북 만들기 도전', copy: '이 영상 보고 따라하면 됩니다! 1.사진 선택 2.테마 고르기 3.완성! 여러분 결과물도 보여주세요~', platform: 'tiktok', imgPrompt: 'Step by step tutorial style, bright colors, finger pointing at phone screen' },
    { angle: '마이크로인플루언서형', hook: '솔직히 광고 아님', copy: '진짜 내돈내산인데... 시어머니 선물로 손주 포토북 만들어드렸더니 울으셨어요 ㅠㅠ 효도앱 인정', platform: 'tiktok', imgPrompt: 'Emotional reaction video style, grandmother receiving photobook gift, tears of joy' },

    // YouTube 소재
    { angle: '권위형', hook: '아이 성장 기록, 이렇게 하세요', copy: '소아과 전문의도 추천하는 성장 기록법. 사진으로 발달 단계를 자동 분류하는 AI 포토북의 모든 것.', platform: 'youtube', imgPrompt: 'Professional YouTube thumbnail with expert recommendation badge, baby milestone chart' },
    { angle: 'FOMO형', hook: '이 앱 알면 인생이 바뀝니다', copy: '3만장 사진 정리를 3초 만에? 100만 부모가 선택한 이유. 지금 안 하면 후회할 겁니다.', platform: 'youtube', imgPrompt: 'Clickbait YouTube thumbnail style, shocked expression, before/after comparison' },

    // Blog 소재
    { angle: '권위형', hook: '2026 최고의 육아 앱 TOP 5', copy: 'AI 기술로 육아가 편해지는 시대. 사진 정리부터 포토북 제작까지, 스마트한 부모들이 선택한 앱을 분석합니다.', platform: 'blog', imgPrompt: 'Clean infographic style showing top 5 apps comparison chart' },
    { angle: '커뮤니티형', hook: '워킹맘의 사진 정리 꿀팁 대방출', copy: '출근 전 5분, 퇴근 후 5분이면 충분합니다. 같은 고민을 가진 워킹맘 300명이 실천하는 사진 정리법을 공개합니다.', platform: 'blog', imgPrompt: 'Warm lifestyle blog header showing organized phone gallery and beautiful photobook' },
  ];

  const insertCreative = db.prepare('INSERT INTO creatives (id, campaign_id, angle, copy_text, hooking_text, image_prompt, platform, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))');
  const creativeIds: string[] = [];
  for (const c of creatives) {
    const cId = crypto.randomUUID();
    creativeIds.push(cId);
    insertCreative.run(cId, campaignId, c.angle, c.copy, c.hook, c.imgPrompt, c.platform);
  }

  // 4. 투표 결과 (니치밴딩 관점)
  const insertVote = db.prepare('INSERT INTO votes (campaign_id, creative_id, jury_id, score, comment) VALUES (?, ?, ?, ?, ?)');
  const nicheComments = [
    '이건 진짜 나를 위한 광고!', '우리 커뮤니티에 공유하고 싶음', '니치 타겟 정확히 잡았네요',
    '이거 보고 바로 설치했을 듯', '공감 100%... 내 얘기인 줄', '마이크로 인플루언서가 쓸 법한 톤',
    'UGC로 퍼질 소재임', '해시태그 전략 좋아요', '커뮤니티 결속력 있는 카피',
    '권위감 있으면서 친근함', 'FOMO 적절함', '니치 문화 코드 잘 반영됨',
  ];
  for (const cId of creativeIds) {
    for (let j = 1; j <= 100; j++) {
      const score = Math.floor(Math.random() * 4) + 6; // 6-9
      const comment = nicheComments[Math.floor(Math.random() * nicheComments.length)];
      insertVote.run(campaignId, cId, j, score, comment);
    }
  }

  // 5. 라이브 이벤트 (팀 미팅 대화)
  const events = [
    ['hana', '하나', 'chat', '팀 여러분, "SNAPTALE" 니치밴딩 캠페인 킥오프입니다!'],
    ['hana', '하나', 'chat', '니치밴딩 핵심: "사진 정리 못하는 워킹맘"을 극도로 세분화된 타겟으로 잡겠습니다.'],
    ['hana', '하나', 'chat', '대중에게 무난한 포토북 앱이 아니라, 이 니치에서 "없으면 안 되는" 앱으로 포지셔닝합니다.'],
    ['minseo', '민서', 'chat', '네! 니치 발견 → 진입 → 장악 → 확장 4단계로 30일 플랜 잡았습니다.'],
    ['minseo', '민서', 'plan', 'Week 1: 육아 커뮤니티 시딩, 마이크로 인플루언서 10명 확보'],
    ['minseo', '민서', 'plan', 'Week 2: #3초포토북챌린지 UGC 바이럴, 커뮤니티 결속'],
    ['minseo', '민서', 'plan', 'Week 3: A/B 테스트 → 위너 소재 퍼포먼스 스케일링'],
    ['minseo', '민서', 'plan', 'Week 4: 반려동물 니치로 볼링핀 확장, 10,000명 달성'],
    ['jiwoo', '지우', 'creative', '니치 롱테일 키워드 분석 완료: "아기 사진 정리 앱", "첫돌 포토북 만들기", "육아 사진 자동 분류"'],
    ['jiwoo', '지우', 'creative', '니치 커뮤니티 언어 반영한 카피 12개 작성 완료! "갤러리에 아이 사진 3만장..." 이런 공감형 카피가 핵심입니다.'],
    ['yuna', '유나', 'creative', '니치 서브컬처 비주얼 컨셉: 따뜻한 파스텔 톤 + 실제 육아 감성. 제네릭한 스톡 이미지 절대 NO!'],
    ['yuna', '유나', 'creative', '안티-제네릭 원칙 적용: "예쁜 광고"가 아니라 "이건 내 상황이다"라고 느끼는 비주얼로 갑니다.'],
    ['doha', '도하', 'creative', 'UGC 챌린지용 숏폼 템플릿 제작 완료. Before(난장판 갤러리) → After(깔끔한 포토북) 3초 전환 효과!'],
    ['taeyang', '태양', 'deploy', '니치 리타겟팅 세팅 완료. #육아스타그램 관심자 + 사진앱 사용자 교차 타겟으로 CPA 최적화합니다.'],
    ['eunji', '은지', 'vote', '100인 심사위원단 니치밴딩 관점 투표 완료! 커뮤니티형 소재가 압도적 1위입니다.'],
    ['eunji', '은지', 'vote', '인사이트: "이건 나를 위한 광고"라는 반응이 커뮤니티형에서 가장 높게 나왔습니다.'],
    ['hana', '하나', 'chat', '훌륭합니다! 니치밴딩 전략이 잘 먹히고 있어요. 핵심 니치 장악 후 볼링핀 확장 진행하겠습니다!'],
    ['hana', '하나', 'system', 'SNAPTALE 니치밴딩 캠페인 파이프라인 완료! 결과물 미리보기에서 확인하세요.'],
  ];

  const insertEvent = db.prepare('INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\', ?))');
  events.forEach((e, i) => {
    insertEvent.run(crypto.randomUUID(), campaignId, e[0], e[1], e[2], e[3], `-${events.length - i} minutes`);
  });

  // 6. 작업 목록
  const tasks = [
    ['minseo', '민서', '니치밴딩 30일 플랜 수립', '니치 발견→진입→장악→확장 기반 플랜', 'completed', '11일치 핵심 플랜 완료'],
    ['jiwoo', '지우', '니치 롱테일 키워드 & SEO 카피', '니치 커뮤니티 언어 기반 12개 카피', 'completed', '12개 니치 SEO 카피 완료'],
    ['yuna', '유나', '니치 서브컬처 비주얼 컨셉', '안티-제네릭 디자인 + 이미지 프롬프트', 'completed', '12개 비주얼 감수 완료'],
    ['doha', '도하', 'UGC 챌린지 숏폼 템플릿', 'Before/After 3초 전환 효과 모션', 'completed', '숏폼 템플릿 3종 완료'],
    ['taeyang', '태양', '니치 리타겟팅 광고 세팅', '육아 관심자 교차 타겟 세그먼트', 'completed', '광고 세팅 완료'],
    ['eunji', '은지', '니치 세그먼트 투표 분석', '100인 심사위원 니치 관점 투표 집계', 'completed', '커뮤니티형 1위 확인'],
    ['siwon', '시원', 'AI 파이프라인 운영', 'LLM API 연동, 데이터 수집 자동화', 'completed', '정상 운영 완료'],
  ];
  const insertTask = db.prepare('INSERT INTO agent_tasks (id, campaign_id, agent_id, agent_name, title, description, status, result, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))');
  for (const t of tasks) {
    insertTask.run(crypto.randomUUID(), campaignId, t[0], t[1], t[2], t[3], t[4], t[5]);
  }

  return NextResponse.json({ campaignId, status: 'demo_created' });
}
