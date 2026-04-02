import type { ProductInfo } from '@/types';
import { CATEGORY_LABELS } from '@/types';

export function buildPlanPrompt(product: ProductInfo): string {
  const categoryLabel = CATEGORY_LABELS[product.category];
  const additionalInfo = Object.entries(product.additionalAnswers || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `당신은 세계 최고의 마케팅 전략 팀의 본부장입니다.
다음 제품의 30일 마케팅 플랜을 생성해주세요.

[제품 정보]
- 카테고리: ${categoryLabel}
- 이름: ${product.name}
- 설명: ${product.description || '없음'}
- 타겟 고객: ${product.targetAudience || '없음'}
- 핵심 차별점: ${product.uniqueValue || '없음'}
${additionalInfo ? `\n[심층 정보]\n${additionalInfo}` : ''}

[전략 분석 요구사항]
다양한 마케팅 기법을 종합적으로 분석하여 이 제품에 가장 효과적인 전략 조합을 찾아주세요:
- 니치 마케팅: 극도로 세분화된 타겟에서 시작하여 점진적 확장
- 바이럴 마케팅: UGC, 챌린지, 밈을 활용한 오가닉 성장
- 퍼포먼스 마케팅: Meta/Google 광고 최적화, A/B 테스트
- 커뮤니티 마케팅: 브랜드 커뮤니티 구축, 팬덤 형성
- 인플루언서 마케팅: 마이크로/나노 인플루언서 협업
- SEO/콘텐츠 마케팅: 롱테일 키워드, 블로그, 교육형 콘텐츠
- 그로스핵: 레퍼럴, 초대 보상, 프리미엄 전환 유도

위 전략들 중 이 제품에 최적인 조합을 선택하고 30일 플랜에 적용하세요.
최소 비용으로 최대 효과를 내는 것이 핵심입니다.

[30일 구조]
- Week 1: 시장 검증 & 초기 유저 확보
- Week 2: 오가닉 성장 & 콘텐츠 확산
- Week 3: 데이터 기반 최적화 & 스케일링
- Week 4: 리텐션 강화 & 목표 달성 (10,000명)

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
  platform: string
): string {
  return `당신은 세계 최고의 크리에이티브 팀입니다.
다음 제품의 ${platform} 마케팅 소재를 생성해주세요.

[제품 정보]
- 이름: ${product.name}
- 설명: ${product.description || product.uniqueValue || ''}
- 타겟: ${product.targetAudience || '일반 소비자'}

[오늘의 마케팅 플랜]
- Day ${day}: ${dayTitle}
- 플랫폼: ${platform}

[요구사항]
최소 비용으로 최대 효과를 낼 수 있는 5가지 앵글로 각각 카피를 생성하세요:
1. 공감형: 타겟의 pain point에 직접 공감하여 "이건 내 얘기다" 반응 유도
2. 바이럴형: B급 감성/밈/챌린지 요소로 자발적 공유 유도 (비용 0원 바이럴)
3. 권위형: 전문성/수치/사회적 증거로 신뢰 구축
4. UGC유도형: 사용자가 직접 콘텐츠를 만들고 공유하고 싶게 만드는 참여형
5. 긴급형: FOMO/한정/시간 제한으로 즉각 행동 유도

각 카피는 해당 플랫폼의 특성(인스타=비주얼, 틱톡=짧고 임팩트, 유튜브=스토리, 블로그=SEO)을 반영하세요.

반드시 아래 JSON 형식으로만 응답하세요:
[
  {
    "angle": "공감형",
    "hookingText": "스크롤을 멈추게 하는 후킹 문구 (15자 이내)",
    "copyText": "본문 카피 (50~100자)",
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
