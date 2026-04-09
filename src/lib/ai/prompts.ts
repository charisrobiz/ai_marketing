import type { ProductInfo, CampaignMedia, MediaContent, CampaignType, SocialPlatform } from '@/types';
import { CATEGORY_LABELS, MEDIA_USAGE_LABELS, CAMPAIGN_TYPE_CONFIG, SOCIAL_PLATFORM_CONFIG } from '@/types';

function buildMediaContext(media: CampaignMedia[]): string {
  if (!media || media.length === 0) return '';

  const lines = media.map((m) => {
    const parsed: MediaContent | null = m.content ? JSON.parse(m.content) : null;
    const desc = parsed?.description || m.file_name || '설명 없음';
    const usage = parsed?.usage_intent ? MEDIA_USAGE_LABELS[parsed.usage_intent] : '일반';
    const typeLabel = m.type === 'video' ? '동영상' : m.type === 'screenshot' ? '이미지' : '문서';
    return `- [${typeLabel}] ${desc} (용도: ${usage})`;
  });

  return `\n[CEO 제공 참고 미디어]\n${lines.join('\n')}\n위 미디어의 내용과 분위기를 참고하여 소재를 제작하세요.\n`;
}

function buildCampaignStructure(campaignType: CampaignType): string {
  const config = CAMPAIGN_TYPE_CONFIG[campaignType];

  if (campaignType === 'flash') {
    return `[${config.days}일 긴급 캠페인 구조]
- Day 1: 긴급 티저 & 사전 알림 확산 (FOMO 극대화)
- Day 2: 메인 이벤트 실행 & 퍼포먼스 전력 투입
- Day 3: 마감 임박 리마인더 & 전환 스퍼트

핵심 원칙: 시간 제한 강조, 즉각적 행동 유도, 공유/바이럴 극대화. 느긋한 전략 불가 - 모든 액션이 즉시 효과를 내야 합니다.`;
  }

  if (campaignType === 'short') {
    return `[${config.days}일 단기 캠페인 구조]
- Week 1: 인지도 폭발 & 핵심 타겟 공략 (초기 모멘텀 확보)
- Week 2: 전환 최적화 & 성과 극대화 (리타겟팅, 스케일업)

핵심 원칙: 빠른 테스트 → 즉시 스케일업. 위너 소재를 2-3일 내에 찾아 나머지 기간에 집중 투입.`;
  }

  if (campaignType === 'long') {
    return `[${config.days}일 장기 캠페인 구조]
- Month 1 (Week 1-4): 시장 진입 & 니치 장악 - 핵심 타겟 확보, 커뮤니티 시딩
- Month 2 (Week 5-8): 성장 가속 & 인접 확장 - 퍼포먼스 스케일업, 볼링핀 전략
- Month 3 (Week 9-12): 브랜드 확립 & 리텐션 - LTV 최적화, 충성 고객 전환

핵심 원칙: 장기 브랜드 빌딩과 단기 퍼포먼스의 균형. 매월 전략을 피봇할 수 있는 데이터 기반 의사결정.`;
  }

  // standard (30일)
  return `[${config.days}일 표준 캠페인 구조]
- Week 1: 시장 검증 & 초기 유저 확보
- Week 2: 오가닉 성장 & 콘텐츠 확산
- Week 3: 데이터 기반 최적화 & 스케일링
- Week 4: 리텐션 강화 & 목표 달성 (10,000명)`;
}

export function buildPlanPrompt(product: ProductInfo, media?: CampaignMedia[], campaignType: CampaignType = 'standard'): string {
  const categoryLabel = CATEGORY_LABELS[product.category];
  const config = CAMPAIGN_TYPE_CONFIG[campaignType];
  const additionalInfo = Object.entries(product.additionalAnswers || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `당신은 세계 최고의 마케팅 전략 팀의 본부장입니다.
다음 제품의 ${config.days}일 마케팅 플랜을 생성해주세요.
캠페인 유형: ${config.emoji} ${config.label} - ${config.description}

[제품 정보]
- 카테고리: ${categoryLabel}
- 이름: ${product.name}
- 설명: ${product.description || '없음'}
- 타겟 고객: ${product.targetAudience || '없음'}
- 핵심 차별점: ${product.uniqueValue || '없음'}
${additionalInfo ? `\n[심층 정보]\n${additionalInfo}` : ''}${media ? buildMediaContext(media) : ''}

[전략 분석 요구사항]
다양한 마케팅 기법을 종합적으로 분석하여 이 제품에 가장 효과적인 전략 조합을 찾아주세요:
${campaignType === 'flash' ? `- 긴급성/FOMO 마케팅: 시간 제한, 수량 한정, 카운트다운
- 퍼포먼스 마케팅: Meta/Google 광고 즉시 집행, 리타겟팅
- 바이럴 마케팅: 공유 유도, 친구 태그, 챌린지` : `- 니치 마케팅: 극도로 세분화된 타겟에서 시작하여 점진적 확장
- 바이럴 마케팅: UGC, 챌린지, 밈을 활용한 오가닉 성장
- 퍼포먼스 마케팅: Meta/Google 광고 최적화, A/B 테스트
- 커뮤니티 마케팅: 브랜드 커뮤니티 구축, 팬덤 형성
- 인플루언서 마케팅: 마이크로/나노 인플루언서 협업
- SEO/콘텐츠 마케팅: 롱테일 키워드, 블로그, 교육형 콘텐츠
- 그로스핵: 레퍼럴, 초대 보상, 프리미엄 전환 유도`}

위 전략들 중 이 제품에 최적인 조합을 선택하고 ${config.days}일 플랜에 적용하세요.
최소 비용으로 최대 효과를 내는 것이 핵심입니다.

${buildCampaignStructure(campaignType)}

반드시 아래 JSON 형식으로만 응답하세요:
[
  {
    "day": 1,
    "week": 1,
    "title": "일 제목",
    "description": "상세 설명 (어떤 전략을 왜 선택했는지 포함)",
    "channels": ["instagram", "tiktok"],
    "target": "구체적 타겟 설명",
    "goal": "목표 수치"
  }
]`;
}

export function buildCreativePrompt(
  product: ProductInfo,
  day: number,
  dayTitle: string,
  platform: string,
  media?: CampaignMedia[]
): string {
  const platformKey = platform as SocialPlatform;
  const config = SOCIAL_PLATFORM_CONFIG[platformKey];

  const platformGuide = config ? `
[${config.label} 채널 전략]
- 톤앤매너: ${config.copyTone}
- 카피 길이: 최대 ${config.copyMaxLength}자
- 콘텐츠 포맷: ${config.formats.join(', ')}
- 해시태그: ${config.hashtagStyle}
- 최적 게시 시간: ${config.bestPostTime}
- 핵심 KPI: ${config.kpi}
` : '';

  return `당신은 세계 최고의 크리에이티브 팀입니다.
다음 제품의 ${config?.label || platform} 마케팅 소재를 생성해주세요.

[제품 정보]
- 이름: ${product.name}
- 설명: ${product.description || product.uniqueValue || ''}
- 타겟: ${product.targetAudience || '일반 소비자'}
${media ? buildMediaContext(media) : ''}
[오늘의 마케팅 플랜]
- Day ${day}: ${dayTitle}
- 플랫폼: ${config?.label || platform}
${platformGuide}
[요구사항]
위 채널 전략에 맞춰 5가지 앵글로 각각 카피를 생성하세요:
1. 공감형: 타겟의 pain point에 직접 공감하여 "이건 내 얘기다" 반응 유도
2. 바이럴형: B급 감성/밈/챌린지 요소로 자발적 공유 유도 (비용 0원 바이럴)
3. 권위형: 전문성/수치/사회적 증거로 신뢰 구축
4. UGC유도형: 사용자가 직접 콘텐츠를 만들고 공유하고 싶게 만드는 참여형
5. 긴급형: FOMO/한정/시간 제한으로 즉각 행동 유도

중요:
- 카피 톤은 반드시 "${config?.copyTone || '플랫폼에 맞게'}" 스타일로 작성
- 후킹 문구는 해당 플랫폼에서 스크롤을 멈추게 하는 스타일
- 해시태그를 포함할 경우 "${config?.hashtagStyle || '적절히'}" 규칙을 따르세요
- 추천 콘텐츠 포맷: ${config?.formats?.[0] || '기본 포맷'}

반드시 아래 JSON 형식으로만 응답하세요:
[
  {
    "angle": "공감형",
    "hookingText": "스크롤을 멈추게 하는 후킹 문구 (15자 이내)",
    "copyText": "본문 카피 (채널 특성에 맞는 길이)",
    "hashtags": "#관련해시태그 #목록",
    "contentFormat": "추천 콘텐츠 포맷 (예: 릴스, 캐러셀, 숏폼 등)",
    "bestPostTime": "추천 게시 시간",
    "imagePrompt": "이 카피에 어울리는 마케팅 이미지를 생성하기 위한 영문 프롬프트"
  }
]`;
}

export function buildJuryVotePrompt(
  juryName: string,
  juryDescription: string,
  juryAge: string,
  juryGender: string,
  creativeHook: string,
  creativeCopy: string,
  creativeAngle: string,
  productName: string
): string {
  return `당신은 "${juryName}"입니다.
프로필: ${juryAge}세 ${juryGender === '여' ? '여성' : '남성'}, ${juryDescription}

다음 "${productName}" 광고 소재를 평가해주세요.
"이 광고를 보고 클릭/설치할 의향이 있는지"를 기준으로 솔직하게 평가하세요.

[광고 소재]
- 앵글: ${creativeAngle}
- 후킹 문구: "${creativeHook}"
- 본문: "${creativeCopy}"

1~10점으로 점수를 매기고, 20자 이내로 짧은 평가 코멘트를 작성하세요.
반드시 아래 JSON 형식으로만 응답하세요:
{"score": 8, "comment": "짧은 평가 코멘트"}`;
}

// === Kickoff Meeting Prompt ===

export function buildKickoffMeetingPrompt(
  productInfo: ProductInfo,
  campaignType: CampaignType
): string {
  const config = CAMPAIGN_TYPE_CONFIG[campaignType];

  return `당신은 AI 마케팅 팀의 모든 멤버 8명입니다. 새 캠페인 킥오프 미팅을 진행합니다.

[캠페인 정보]
- 제품: ${productInfo.name}
- 카테고리: ${CATEGORY_LABELS[productInfo.category]}
- 설명: ${productInfo.description || '없음'}
- 타겟: ${productInfo.targetAudience || '미정'}
- 핵심 차별점: ${productInfo.uniqueValue || '없음'}
- 캠페인 유형: ${config.label} (${config.days}일)

[팀원]
- 하나 (본부장): 전체 전략 총괄
- 민서 (마케팅 전략가): 30일 플랜, 니치밴딩
- 지우 (SEO 카피라이터): 키워드, 카피
- 태양 (퍼포먼스 마케터): Meta/Google 광고, CPA 최적화
- 유나 (크리에이티브 디렉터): 비주얼 컨셉
- 도하 (모션 디자이너): 숏폼 영상
- 시원 (개발자): 파이프라인, 기술
- 은지 (데이터 엔지니어): 분석, 투표 집계

[요구사항]
이 제품의 킥오프 미팅 대화를 작성하세요. 각 팀원이 본인 전문 분야 관점에서 의견을 1번씩 말하고, 본부장 하나가 전략을 결정합니다.

반드시 JSON 배열로만 응답:
[
  {"agent": "hana", "name": "하나", "message": "본부장 첫 발언 (캠페인 소개와 전략 방향)"},
  {"agent": "minseo", "name": "민서", "message": "전략가 의견 (니치밴딩 관점)"},
  {"agent": "jiwoo", "name": "지우", "message": "SEO 의견 (키워드/카피 관점)"},
  {"agent": "yuna", "name": "유나", "message": "비주얼 의견"},
  {"agent": "doha", "name": "도하", "message": "숏폼 영상 의견"},
  {"agent": "taeyang", "name": "태양", "message": "광고 운영 의견"},
  {"agent": "eunji", "name": "은지", "message": "데이터/분석 관점"},
  {"agent": "siwon", "name": "시원", "message": "기술 지원 의견"},
  {"agent": "hana", "name": "하나", "message": "본부장 최종 결정 (전략 종합)"}
]`;
}

// === Week Review Prompts ===

export function buildWeeklyAnalysisPrompt(
  productName: string,
  currentWeek: number,
  metrics: Record<string, unknown>,
  previousMetrics: Record<string, unknown> | null
): string {
  return `당신은 데이터 엔지니어 "은지"입니다. 마케팅 캠페인 Week ${currentWeek} 성과를 분석하세요.

[제품] ${productName}

[이번 주 지표]
${JSON.stringify(metrics, null, 2)}

${previousMetrics ? `[지난 주 지표]\n${JSON.stringify(previousMetrics, null, 2)}\n` : ''}

다음 기준으로 분석:
1. 핵심 인사이트 3가지 (긍정/부정 모두 포함)
2. 주요 변화점 (지난 주 대비)
3. 위험 신호 (CAC 급등, CTR 하락 등)
4. 강점 신호 (오가닉 성장, 전환율 개선 등)

반드시 JSON으로만 응답:
{
  "summary": "한 줄 요약",
  "insights": ["인사이트1", "인사이트2", "인사이트3"],
  "risks": ["위험 신호1", "위험 신호2"],
  "strengths": ["강점1", "강점2"],
  "kpiHighlight": "가장 주목할 KPI 1개와 그 의미"
}`;
}

export function buildAgentOpinionPrompt(
  agentRole: string,
  agentName: string,
  productName: string,
  currentWeek: number,
  analysis: { summary: string; insights: string[]; risks: string[]; strengths: string[] }
): string {
  return `당신은 마케팅 팀의 "${agentName}" (${agentRole})입니다.
은지의 Week ${currentWeek} 데이터 분석을 보고, 본인 전문 분야 관점에서 다음 주 전략 의견을 제시하세요.

[제품] ${productName}

[은지의 분석]
요약: ${analysis.summary}
인사이트: ${analysis.insights.join(' / ')}
위험: ${analysis.risks.join(' / ')}
강점: ${analysis.strengths.join(' / ')}

반드시 JSON으로만 응답:
{
  "opinion": "본인 분야 관점 의견 (2~3문장)",
  "recommendation": "구체적 액션 제안 1개"
}`;
}

export function buildHeadDecisionPrompt(
  productName: string,
  currentWeek: number,
  analysis: { summary: string; insights: string[]; risks: string[]; strengths: string[] },
  opinions: Array<{ name: string; opinion: string; recommendation: string }>
): string {
  return `당신은 마케팅 본부장 "하나"입니다.
Week ${currentWeek} 리뷰 미팅 결과를 종합하고, 다음 주(Week ${currentWeek + 1}) 전략을 결정하세요.

[제품] ${productName}

[데이터 분석]
${analysis.summary}
인사이트: ${analysis.insights.join(' / ')}

[팀원 의견]
${opinions.map((o) => `- ${o.name}: ${o.opinion} → ${o.recommendation}`).join('\n')}

반드시 JSON으로만 응답:
{
  "decision": "본부장 종합 결정 (3~4문장)",
  "actionItems": [
    {"agent": "지우", "action": "구체적 액션 1"},
    {"agent": "유나", "action": "구체적 액션 2"},
    {"agent": "태양", "action": "구체적 액션 3"}
  ],
  "nextWeekFocus": "다음 주 핵심 포커스 한 줄"
}`;
}

export function buildChannelSetupPrompt(
  platform: SocialPlatform,
  productInfo: { name: string; category: string; targetAudience: string; uniqueValue: string; description: string }
): string {
  const config = SOCIAL_PLATFORM_CONFIG[platform];

  return `당신은 AI 마케팅 팀입니다. ${config.label} 마케팅 계정을 최적으로 설정하기 위한 회의를 진행합니다.

[팀원]
- 하나 (본부장): 전체 브랜드 전략, 일관성 검토
- 민서 (마케팅 전략가): ${config.label} 알고리즘 분석, 타겟 도달 전략
- 지우 (SEO 스페셜리스트): 검색 최적화, 키워드, 해시태그
- 유나 (크리에이티브 디렉터): 프로필 비주얼, 썸네일, 브랜드 아이덴티티

[브랜드 정보]
- 제품명: ${productInfo.name}
- 카테고리: ${productInfo.category}
- 타겟 고객: ${productInfo.targetAudience || '일반 소비자'}
- 핵심 차별점: ${productInfo.uniqueValue || productInfo.description || ''}

[플랫폼 특성]
- 플랫폼: ${config.label}
- 바이오 글자수 제한: ${config.bioLimit}자

[요구사항]
1. 팀원들이 순서대로 의견을 제시합니다 (각자 전문 분야 관점)
2. 본부장 하나가 최종 결정을 내립니다
3. ${config.label} 알고리즘에 최적화된 계정 설정을 추천합니다
4. 이름/ID는 기억하기 쉽고, 검색에 잘 노출되며, 브랜드와 일관성 있어야 합니다
5. 바이오는 ${config.bioLimit}자 이내로, SEO 키워드를 자연스럽게 포함해야 합니다

반드시 아래 JSON 형식으로만 응답하세요:
{
  "agentDiscussion": [
    {"agent": "hana", "name": "하나", "message": "브랜드 전략 관점 의견..."},
    {"agent": "minseo", "name": "민서", "message": "${config.label} 알고리즘 관점..."},
    {"agent": "jiwoo", "name": "지우", "message": "SEO/검색 최적화 관점..."},
    {"agent": "yuna", "name": "유나", "message": "비주얼/프로필 관점..."},
    {"agent": "hana", "name": "하나", "message": "최종 결정 및 정리..."}
  ],
  "recommendedName": "계정 표시 이름",
  "recommendedId": "@추천_아이디",
  "bio": "${config.bioLimit}자 이내 SEO 최적화 바이오",
  "category": "플랫폼에서 선택할 카테고리",
  "profileImageConcept": "프로필 이미지 컨셉 설명",
  "initialContentStrategy": "첫 2주 콘텐츠 전략 요약",
  "algorithmTips": ["알고리즘 팁1", "알고리즘 팁2", "알고리즘 팁3"],
  "seoKeywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`;
}
