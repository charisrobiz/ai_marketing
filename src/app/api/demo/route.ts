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
    { angle: '공감형', hook: '육아맘만 아는 이 고통', copy: '갤러리에 아이 사진 3만장... 정리는 언제 하지? 같은 고민이라면 우리가 답이에요. #육아맘공감 #사진정리꿀팁', platform: 'instagram', imgPrompt: 'Overwhelmed parent surrounded by thousands of cute baby photos, warm pastel colors, relatable humor style' },
    { angle: '권위형', hook: '10만 가정이 선택한 이유', copy: 'AI가 아이 사진을 발달 단계별로 자동 분류. 전문 레이아웃으로 성장 기록의 정석을 만들어드립니다.', platform: 'instagram', imgPrompt: 'Professional looking baby photo album with gold accents, expert badge, clean minimal design' },
    { angle: 'UGC유도형', hook: '#3초포토북챌린지 도전!', copy: '사진 10장 골라서 넣으면 끝! 3초 만에 완성된 포토북 Before/After 공유하고 프리미엄 1년 무료 받기', platform: 'instagram', imgPrompt: 'Split screen before/after showing messy photo gallery vs beautiful photobook, challenge style graphic' },
    { angle: '바이럴형', hook: '이거 진짜 3초 만에 됨', copy: '직접 써봤는데... 와 진짜 사진 고르고 3초면 포토북 나옴 ㅋㅋㅋ 속은 셈 치고 해보세요. 이건 사기임(좋은 의미)', platform: 'instagram', imgPrompt: 'Casual selfie style photo of someone showing phone screen with photobook app, authentic feel' },
    { angle: '긴급형', hook: '오늘까지만 무료입니다', copy: '첫돌 포토북 무료 이벤트 D-1. 프리미엄 테마 10종 + PDF 추출 무료. 내일부터 정가 29,900원.', platform: 'instagram', imgPrompt: 'Countdown timer with urgency red accent, premium photobook preview, exclusive badge' },

    // TikTok 소재
    { angle: '공감형', hook: '아이 사진 몇장이세요?', copy: '저는 27,483장이요... 그 중 정리한 건 0장. 같은 분 손들어주세요 🙋‍♀️ (해결법 영상 끝까지 보세요)', platform: 'tiktok', imgPrompt: 'Viral TikTok style text overlay, surprised face, phone showing photo count' },
    { angle: 'UGC유도형', hook: '3초 포토북 만들기 도전', copy: '이 영상 보고 따라하면 됩니다! 1.사진 선택 2.테마 고르기 3.완성! 여러분 결과물도 보여주세요~', platform: 'tiktok', imgPrompt: 'Step by step tutorial style, bright colors, finger pointing at phone screen' },
    { angle: '바이럴형', hook: '시어머니가 울었습니다', copy: '내돈내산 후기. 손주 포토북 만들어드렸더니 전화가 왔어요. "이게 세상에..." 효도앱 인정합니다 ㅠㅠ', platform: 'tiktok', imgPrompt: 'Emotional reaction video style, grandmother receiving photobook gift, tears of joy' },

    // YouTube 소재
    { angle: '권위형', hook: '아이 성장 기록, 이렇게 하세요', copy: '소아과 전문의도 추천하는 성장 기록법. 사진으로 발달 단계를 자동 분류하는 AI 포토북의 모든 것.', platform: 'youtube', imgPrompt: 'Professional YouTube thumbnail with expert recommendation badge, baby milestone chart' },
    { angle: '긴급형', hook: '이 앱 알면 인생이 바뀝니다', copy: '3만장 사진 정리를 3초 만에? 100만 부모가 선택한 이유. 지금 안 하면 후회할 겁니다.', platform: 'youtube', imgPrompt: 'Clickbait YouTube thumbnail style, shocked expression, before/after comparison' },

    // Blog 소재
    { angle: '권위형', hook: '2026 최고의 육아 앱 TOP 5', copy: 'AI 기술로 육아가 편해지는 시대. 사진 정리부터 포토북 제작까지, 스마트한 부모들이 선택한 앱을 분석합니다.', platform: 'blog', imgPrompt: 'Clean infographic style showing top 5 apps comparison chart' },
    { angle: '공감형', hook: '워킹맘의 사진 정리 꿀팁 대방출', copy: '출근 전 5분, 퇴근 후 5분이면 충분합니다. 같은 고민을 가진 워킹맘 300명이 실천하는 사진 정리법을 공개합니다.', platform: 'blog', imgPrompt: 'Warm lifestyle blog header showing organized phone gallery and beautiful photobook' },
  ];

  const insertCreative = db.prepare('INSERT INTO creatives (id, campaign_id, angle, copy_text, hooking_text, image_prompt, platform, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))');
  const creativeIds: string[] = [];
  for (const c of creatives) {
    const cId = crypto.randomUUID();
    creativeIds.push(cId);
    insertCreative.run(cId, campaignId, c.angle, c.copy, c.hook, c.imgPrompt, c.platform);
  }

  // 4. 투표 결과
  const insertVote = db.prepare('INSERT INTO votes (campaign_id, creative_id, jury_id, score, comment) VALUES (?, ?, ?, ?, ?)');
  const voteComments = [
    '이거 보고 바로 설치했을 듯', '공감 100%... 내 얘기인 줄', '카피가 직관적이고 좋아요',
    'SNS에 공유하고 싶은 느낌', '진정성 있는 톤이 좋아요', '타겟을 정확히 잡았네요',
    'UGC로 퍼질 소재임', '클릭하고 싶어지는 후킹', '신뢰가 가는 카피',
    '재미있어서 끝까지 봤음', '임팩트 있는 비주얼', '가성비 메시지가 명확함',
  ];
  for (const cId of creativeIds) {
    for (let j = 1; j <= 100; j++) {
      const score = Math.floor(Math.random() * 4) + 6; // 6-9
      const comment = voteComments[Math.floor(Math.random() * voteComments.length)];
      insertVote.run(campaignId, cId, j, score, comment);
    }
  }

  // 5. 라이브 이벤트 (팀 미팅 대화)
  const events = [
    // === 킥오프 미팅 ===
    ['hana', '하나', 'chat', '팀 여러분, "SNAPTALE" 캠페인 킥오프 미팅 시작합니다. AI 포토북 앱인데, 30일 안에 1만 명을 만들어야 합니다.'],
    ['hana', '하나', 'chat', '예산은 한정적이에요. 최소 비용으로 최대 효과를 내는 전략 조합을 찾아야 합니다. 각자 아이디어 자유롭게 말씀해주세요.'],

    // === 전략 토론 ===
    ['minseo', '민서', 'chat', '일단 타겟 분석부터 해볼게요. "20~40대 부모"는 너무 넓습니다. 저는 "아이 사진 정리 못하는 워킹맘"으로 좁혀서 니치 마케팅으로 시작하는 게 좋을 것 같아요.'],
    ['taeyang', '태양', 'chat', '민서님 의견에 동의하지만, 니치만으로는 1만 명이 힘들어요. 초반 니치로 시작하되 Week 3부터는 퍼포먼스 광고로 확장해야 합니다. CPA 기준 1,000원 이하가 목표예요.'],
    ['minseo', '민서', 'chat', '좋은 포인트예요 태양님. 그럼 Week 1-2는 니치+바이럴로 씨드 유저를 만들고, Week 3부터 퍼포먼스로 스케일업하는 하이브리드 전략은 어떨까요?'],
    ['jiwoo', '지우', 'chat', '저도 동의합니다. SEO 관점에서 "아기 포토북 만들기", "첫돌 사진 정리" 같은 롱테일 키워드가 경쟁이 낮아요. 블로그 SEO로 오가닉 유입을 깔고, 위에 퍼포먼스를 얹으면 비용 효율이 극대화됩니다.'],
    ['yuna', '유나', 'chat', '비주얼 관점에서 한 가지 제안. 스톡 이미지 쓰면 다른 앱과 구분이 안 돼요. 실제 엄마가 아이 사진 고르는 장면, 포토북 받고 감동하는 장면... 리얼한 감성이 클릭률을 2배 이상 올립니다.'],
    ['doha', '도하', 'chat', '유나님 의견에 추가로, 틱톡에서 Before/After 포맷이 지금 엄청 먹히고 있어요. 갤러리 난장판 → 3초 만에 포토북 완성 전환 영상을 만들면 바이럴 가능성 높습니다.'],
    ['taeyang', '태양', 'chat', '도하님 그 Before/After 숏폼을 광고 소재로도 쓸 수 있어요. 오가닉으로 반응 좋으면 그대로 광고에 태우면 CPA가 훨씬 낮아집니다.'],
    ['eunji', '은지', 'chat', '데이터 관점에서 말씀드리면, 비슷한 앱들의 CAC가 평균 2,000원인데, UGC 기반으로 가면 500원대까지 내릴 수 있어요. 바이럴 + 퍼포먼스 하이브리드가 데이터상 최적입니다.'],
    ['siwon', '시원', 'chat', '기술적으로 UGC 챌린지를 하려면 앱 내 공유 기능이 필요한데, 딥링크 + 레퍼럴 코드를 붙이면 바이럴 경로 추적도 가능합니다.'],

    // === 하나 종합 의사결정 ===
    ['hana', '하나', 'chat', '좋습니다. 모든 의견 종합하면 단일 전략이 아니라 복합 전략이 답이네요. 정리할게요.'],
    ['hana', '하나', 'system', '[전략 결정] Week 1-2: 니치 타겟 + 바이럴(UGC 챌린지) + SEO로 씨드 유저 확보 / Week 3-4: 퍼포먼스 광고 스케일업 + 인접 타겟 확장. 예상 CAC: 500~800원.'],
    ['minseo', '민서', 'chat', '합리적인 조합이에요. 바로 30일 플랜 세부 작업 들어갈게요.'],

    // === 업무 분배 토론 ===
    ['hana', '하나', 'chat', '업무 분배합니다. 민서님 30일 플랜, 지우님 SEO 키워드+카피, 유나님 비주얼 컨셉, 도하님 숏폼 영상, 태양님 광고 세팅, 은지님 데이터 분석, 시원님 기술 지원.'],
    ['yuna', '유나', 'chat', '본부장님, 카피와 비주얼은 따로 만들면 안 맞을 수 있어요. 지우님이랑 같이 작업하면서 카피-이미지 톤을 맞추는 게 좋겠습니다.'],
    ['jiwoo', '지우', 'chat', '유나님 좋은 제안이에요! 카피 초안 나오면 바로 공유드릴 테니 비주얼 톤 맞춰주세요. 특히 공감형 카피는 따뜻한 파스텔 톤이 어울릴 것 같은데 어떠세요?'],
    ['yuna', '유나', 'chat', '네 공감형은 파스텔 톤 좋고, 바이럴형은 오히려 과감한 색 대비가 스크롤 스톱에 효과적이에요. 앵글별로 톤을 다르게 가져갈게요.'],
    ['doha', '도하', 'chat', '저도 유나님 비주얼 가이드라인 받으면 모션에 바로 반영합니다. 그리고 태양님, 숏폼 광고 소재도 필요하시죠?'],
    ['taeyang', '태양', 'chat', '네! 오가닉에서 반응 좋은 숏폼을 광고 소재로 바로 전환할 거예요. 도하님 작업물 중 CTR 높은 걸 골라서 태울게요.'],
    ['eunji', '은지', 'chat', '제가 오가닉 반응 데이터를 실시간으로 뽑아드릴게요. 조회수, 저장수, 공유수 기준으로 위너 소재를 빠르게 판별하겠습니다.'],

    // === 작업 진행 보고 ===
    ['minseo', '민서', 'plan', '30일 플랜 초안 완성했어요. Week 1에 핵심은 마이크로 인플루언서 10명 확보 + 육아 커뮤니티 시딩이에요. 예산은 50만원 이내로 잡았습니다.'],
    ['hana', '하나', 'chat', '민서님 50만원이면 인플루언서당 5만원인데, 나노 인플루언서(1K-5K)는 무료 체험만으로도 충분히 가능해요. 현금 지출을 줄여봅시다.'],
    ['minseo', '민서', 'chat', '아 맞다, 좋은 포인트예요! 무료 체험 제공으로 전환하면 Week 1 예산을 0원으로 줄일 수 있겠네요. 수정합니다.'],
    ['jiwoo', '지우', 'creative', 'SEO 키워드 리서치 완료. "아기 사진 정리 앱" 월간 검색량 2,400 / 경쟁 낮음, "첫돌 포토북 만들기" 1,800 / 경쟁 낮음. 이 두 개를 메인 키워드로 잡겠습니다.'],
    ['jiwoo', '지우', 'creative', '카피 12개 초안 완성! 공감형 "갤러리에 아이 사진 3만장..." 이게 가장 반응 좋을 것 같은데, 유나님 비주얼 의견 주세요.'],
    ['yuna', '유나', 'creative', '지우님 공감형 카피 봤어요. 이건 실제 핸드폰 갤러리 스크린샷 느낌의 비주얼이 딱이에요. 스톡 이미지 말고 리얼 목업으로 갈게요.'],
    ['yuna', '유나', 'creative', '바이럴형 "#3초포토북챌린지"는 색 대비 강한 Before/After 분할 화면으로. 도하님, 이 컨셉으로 모션 작업 가능하죠?'],
    ['doha', '도하', 'creative', '네 완벽해요! Before 화면은 흔들리는 느낌으로, After는 깔끔하게 전환하면 임팩트 최대예요. 3초 컷으로 만들어볼게요.'],
    ['taeyang', '태양', 'chat', '은지님, 지금 경쟁 앱들 광고 데이터 좀 볼 수 있을까요? 어떤 타겟 세그먼트가 가장 CPA가 낮은지 벤치마크하고 싶어요.'],
    ['eunji', '은지', 'chat', '경쟁사 분석 데이터 뽑았어요. 25-34세 여성, "육아" 관심사에서 CPA가 가장 낮고요(약 700원), 35-44세는 전환율은 높지만 CPA가 1,200원이에요. 초반에는 25-34세에 집중 추천합니다.'],
    ['taeyang', '태양', 'chat', '고맙습니다! 그러면 25-34세로 먼저 검증하고, 성과 나오면 35-44세로 확장할게요. 예산 효율이 2배 차이나니까 순서가 중요하네요.'],

    // === 중간 리뷰 ===
    ['hana', '하나', 'chat', '중간 점검합니다. 민서님 플랜 예산 0원 시작 좋고, 지우님-유나님 카피-비주얼 협업 흐름 좋습니다. 한 가지 추가로, 레퍼럴 프로그램은 어떨까요? "친구 초대하면 프리미엄 1개월 무료" 같은.'],
    ['siwon', '시원', 'chat', '기술적으로 레퍼럴 시스템은 초대 코드 + 딥링크로 빠르게 구현 가능해요. K-Factor 1.2만 넘겨도 바이럴 효과가 발생합니다.'],
    ['minseo', '민서', 'chat', '레퍼럴 좋아요! Week 2에 UGC 챌린지와 함께 넣으면 시너지 날 것 같습니다. "포토북 만들고 → 친구 초대 → 둘 다 프리미엄" 구조요.'],
    ['eunji', '은지', 'chat', '레퍼럴 데이터 추적도 제가 세팅해둘게요. 초대 전환율, 바이럴 계수 실시간으로 모니터링하겠습니다.'],

    // === 최종 결과 공유 ===
    ['hana', '하나', 'chat', '모든 팀원 수고하셨습니다! 전략 요약: 니치 타겟(워킹맘)으로 시작 → UGC 바이럴 챌린지 → SEO 오가닉 기반 → 퍼포먼스 스케일업. 예상 CAC: 500~800원, 총 예산: 500~800만원으로 1만 명 달성.'],
    ['hana', '하나', 'system', 'SNAPTALE 캠페인 전략 수립 완료! 결과물 미리보기에서 최종 소재를 확인하세요.'],
  ];

  const insertEvent = db.prepare('INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\', ?))');
  events.forEach((e, i) => {
    insertEvent.run(crypto.randomUUID(), campaignId, e[0], e[1], e[2], e[3], `-${events.length - i} minutes`);
  });

  // 6. 작업 목록
  const tasks = [
    ['minseo', '민서', '30일 하이브리드 마케팅 플랜', '니치+바이럴+퍼포먼스 복합 전략, 예산 최적화', 'completed', '11일치 핵심 플랜 완료, Week1 예산 0원 달성'],
    ['jiwoo', '지우', 'SEO 키워드 분석 & 카피 12종', '롱테일 키워드 리서치 + 5가지 앵글 카피라이팅', 'completed', '12개 카피 완료, 유나님과 톤 맞춤 협업'],
    ['yuna', '유나', '플랫폼별 비주얼 컨셉 & 감수', '앵글별 톤 분리, 리얼 목업 기반 비주얼 가이드', 'completed', '12개 비주얼 감수, 지우님 카피와 톤 매칭'],
    ['doha', '도하', 'Before/After 숏폼 영상 제작', '3초 전환 효과 모션, UGC 챌린지 템플릿', 'completed', '숏폼 3종 완료, 유나님 가이드 반영'],
    ['taeyang', '태양', '퍼포먼스 광고 세팅 & 타겟 최적화', '25-34세 우선 타겟, 은지님 데이터 기반 CPA 최적화', 'completed', 'CPA 700원 목표 세팅, 오가닉 위너 소재 전환 준비'],
    ['eunji', '은지', '경쟁사 분석 & 투표 데이터 분석', '경쟁사 CPA 벤치마크, 100인 심사위원 투표 집계', 'completed', '공감형 1위, 25-34세 CPA 최저 확인'],
    ['siwon', '시원', '레퍼럴 시스템 & 파이프라인 구축', '딥링크+초대코드 시스템, 바이럴 계수 추적', 'completed', 'K-Factor 추적 시스템 구축 완료'],
  ];
  const insertTask = db.prepare('INSERT INTO agent_tasks (id, campaign_id, agent_id, agent_name, title, description, status, result, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))');
  for (const t of tasks) {
    insertTask.run(crypto.randomUUID(), campaignId, t[0], t[1], t[2], t[3], t[4], t[5]);
  }

  return NextResponse.json({ campaignId, status: 'demo_created' });
}
