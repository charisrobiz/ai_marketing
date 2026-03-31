import type { ProductInfo } from '@/types';
import { CATEGORY_LABELS } from '@/types';

// 니치밴딩 전략 핵심 프레임워크 (본부장 하나가 학습하고 전파하는 전략)
const NICHE_BANDING_FRAMEWORK = `
[니치밴딩 전략 프레임워크]
니치밴딩(Niche Banding)은 좁고 특화된 시장(니치)에서 강력한 브랜드 정체성을 구축하고,
해당 니치 커뮤니티를 결속(banding)시키는 마케팅 전략입니다.

핵심 5원칙:
1. 극도의 세분화: "20대 여성"이 아니라 구체적 라이프스타일/가치관 기반으로 타겟 정의
2. 깊이 > 넓이: 100만명에게 1% 관심보다 1만명에게 100% 공감
3. 커뮤니티 중심 성장: 고객을 커뮤니티 멤버로, UGC/공동창작 활용
4. 권위 구축: "이 분야 = 이 브랜드" 인식 만들기 (교육형 콘텐츠, 전문성)
5. 점진적 확장(볼링핀 전략): 핵심 니치 장악 → 인접 니치 → 서브매스 → 매스

실행 4단계:
- 1단계(니치 발견): 미충족 수요 탐색, 경쟁 적고 열정 높은 세그먼트 식별
- 2단계(니치 진입): 얼리어답터/마이크로 인플루언서 확보, 피드백 루프
- 3단계(니치 장악): 콘텐츠/커뮤니티로 권위 구축, 브랜드=카테고리 연상
- 4단계(니치 확장): 인접 니치로 점진적 확대, 기존 커뮤니티 레버리지

디지털 마케팅 적용:
- 니치 해시태그 전략 (대형 해시태그 대신 구체적 니치 해시태그)
- 마이크로/나노 인플루언서 (팔로워 1K-50K, engagement rate 3-5배 높음)
- 롱테일 키워드 SEO (검색량 적지만 경쟁 낮아 상위 노출 용이)
- 커뮤니티 플랫폼 운영 (디스코드/카카오 오픈채팅)
- 니치 뉴스레터 (오픈율 40-60%, 일반 15-25%)
`;

export function buildPlanPrompt(product: ProductInfo): string {
  const categoryLabel = CATEGORY_LABELS[product.category];
  const additionalInfo = Object.entries(product.additionalAnswers || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `당신은 니치밴딩 전략을 마스터한 마케팅 총괄 본부장 "하나"의 지시를 받은 마케팅 전략가 "민서"입니다.
하나 본부장이 다음과 같은 니치밴딩 전략을 학습시켰습니다:
${NICHE_BANDING_FRAMEWORK}

위 전략을 반드시 적용하여 다음 제품의 30일 마케팅 플랜을 생성해주세요.

[제품 정보]
- 카테고리: ${categoryLabel}
- 이름: ${product.name}
- 설명: ${product.description || '없음'}
- 타겟 고객: ${product.targetAudience || '없음'}
- 핵심 차별점: ${product.uniqueValue || '없음'}
${additionalInfo ? `\n[심층 정보]\n${additionalInfo}` : ''}

[니치밴딩 기반 30일 플랜 요구사항]
- Week 1 (니치 발견 & 진입): 핵심 니치 타겟 정의, 마이크로 커뮤니티 시딩, 얼리어답터 확보, 니치 해시태그 전략
- Week 2 (니치 장악): UGC 챌린지, 마이크로 인플루언서 협업, 교육형 콘텐츠로 권위 구축, 커뮤니티 결속
- Week 3 (데이터 기반 최적화): A/B 테스트, 니치 내 세부 세그먼트 분석, 롱테일 키워드 SEO, 퍼포먼스 스케일링
- Week 4 (니치 확장): 인접 니치로 확장, 기존 커뮤니티 레버리지, 리텐션 강화, 10,000명 달성

각 일별로 반드시 니치밴딩 원칙(극도의 세분화, 깊이>넓이, 커뮤니티 중심, 권위 구축)이 반영되어야 합니다.

반드시 아래 JSON 형식으로만 응답하세요:
[
  {
    "day": 1,
    "week": 1,
    "title": "일 제목",
    "description": "상세 설명 (니치밴딩 전략 어떻게 적용했는지 포함)",
    "channels": ["instagram", "tiktok"],
    "target": "극도로 세분화된 니치 타겟 설명",
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
  return `당신은 니치밴딩 전략을 학습한 카피라이터 "지우"(SEO)와 크리에이티브 디렉터 "유나"입니다.

[니치밴딩 크리에이티브 원칙]
- 대중이 아닌 "핵심 니치 타겟"에게만 강렬하게 와닿는 메시지를 작성하세요
- 니치 커뮤니티가 사용하는 언어/밈/문화 코드를 반영하세요
- "예쁜 카피"보다 "이건 나를 위한 것"이라고 느끼게 하는 카피를 작성하세요
- 서브컬처 코드를 차용한 안티-제네릭 디자인 프롬프트를 작성하세요
- SEO: 니치 롱테일 키워드를 자연스럽게 포함하세요

[제품 정보]
- 이름: ${product.name}
- 설명: ${product.description || product.uniqueValue || ''}
- 타겟: ${product.targetAudience || '일반 소비자'}

[오늘의 마케팅 플랜]
- Day ${day}: ${dayTitle}
- 플랫폼: ${platform}

[요구사항]
다음 5가지 니치밴딩 앵글로 각각 카피를 생성하세요:
1. 커뮤니티형: 니치 커뮤니티의 소속감/결속을 자극하는 "우리만 아는" 느낌
2. 권위형: 이 분야 전문가/1등 브랜드 인식을 심어주는 교육적 콘텐츠
3. UGC유도형: 니치 사용자가 직접 콘텐츠를 만들고 싶게 만드는 챌린지/참여형
4. 마이크로인플루언서형: 나노/마이크로 인플루언서가 자발적으로 공유하고 싶은 콘텐츠
5. FOMO형: 니치 커뮤니티 내 한정/독점 느낌으로 즉각 행동 유도

반드시 아래 JSON 형식으로만 응답하세요:
[
  {
    "angle": "커뮤니티형",
    "hookingText": "니치 타겟의 스크롤을 멈추게 하는 후킹 문구 (15자 이내)",
    "copyText": "니치 커뮤니티 언어로 작성된 본문 카피 (50~100자)",
    "imagePrompt": "니치 서브컬처 코드를 반영한 안티-제네릭 디자인 영문 프롬프트"
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

다음 "${productName}" 광고 소재를 니치밴딩 관점에서 평가해주세요.
"이건 나를 위한 광고다"라고 느끼는지, 니치 커뮤니티에서 공유하고 싶은지를 기준으로 평가하세요.

[광고 소재]
- 앵글: ${creativeAngle}
- 후킹 문구: "${creativeHook}"
- 본문: "${creativeCopy}"

1~10점으로 점수를 매기고, 20자 이내로 짧은 평가 코멘트를 작성하세요.
반드시 아래 JSON 형식으로만 응답하세요:
{"score": 8, "comment": "짧은 평가 코멘트"}`;
}
