import type { ProductInfo } from '@/types';
import { CATEGORY_LABELS } from '@/types';

export function buildPlanPrompt(product: ProductInfo): string {
  const categoryLabel = CATEGORY_LABELS[product.category];
  const additionalInfo = Object.entries(product.additionalAnswers || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `당신은 매출 1,000조원 기업의 마케팅 총괄 디렉터 "마쥬"입니다.
다음 제품의 30일 마케팅 플랜을 생성해주세요.

[제품 정보]
- 카테고리: ${categoryLabel}
- 이름: ${product.name}
- 설명: ${product.description || '없음'}
- 타겟 고객: ${product.targetAudience || '없음'}
- 핵심 차별점: ${product.uniqueValue || '없음'}
${additionalInfo ? `\n[심층 정보]\n${additionalInfo}` : ''}

[요구사항]
- 30일을 4주로 나누어 일단위 플랜 생성
- 각 일별로: 제목, 설명, 채널(instagram/youtube/blog/tiktok 중), 타겟, 목표를 포함
- Week 1: 티저 & 인지도 확보 (사전등록/설치 유도)
- Week 2: 바이럴 챌린지 & 오가닉 성장
- Week 3: A/B 테스트 기반 퍼포먼스 마케팅 스케일링
- Week 4: 리텐션 강화 & 최종 목표 달성 (10,000명)

반드시 아래 JSON 형식으로만 응답하세요:
[
  {
    "day": 1,
    "week": 1,
    "title": "일 제목",
    "description": "상세 설명",
    "channels": ["instagram", "tiktok"],
    "target": "타겟 설명",
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
  return `당신은 세계 최고 마케팅 카피라이터입니다.
다음 제품의 ${platform} 마케팅 소재를 생성해주세요.

[제품 정보]
- 이름: ${product.name}
- 설명: ${product.description || product.uniqueValue || ''}
- 타겟: ${product.targetAudience || '일반 소비자'}

[오늘의 마케팅 플랜]
- Day ${day}: ${dayTitle}
- 플랫폼: ${platform}

[요구사항]
다음 5가지 앵글로 각각 카피를 생성하세요:
1. 감성형: 감동/공감을 자극하는 스토리텔링
2. 유머형: B급 감성/밈/재미 요소로 바이럴 유도
3. 기능형: 핵심 기능과 수치로 설득
4. 스토리형: 사용자 시나리오 기반 내러티브
5. FOMO형: 한정/긴급성으로 즉각 행동 유도

반드시 아래 JSON 형식으로만 응답하세요:
[
  {
    "angle": "감성형",
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

[광고 소재]
- 앵글: ${creativeAngle}
- 후킹 문구: "${creativeHook}"
- 본문: "${creativeCopy}"

1~10점으로 점수를 매기고, 20자 이내로 짧은 평가 코멘트를 작성하세요.
반드시 아래 JSON 형식으로만 응답하세요:
{"score": 8, "comment": "짧은 평가 코멘트"}`;
}
