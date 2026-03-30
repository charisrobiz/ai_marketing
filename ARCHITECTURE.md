# Auto-Growth Engine V1 - Architecture

## 개요
AI 직원(에이전트)들이 팀으로 협업하여 마케팅을 자동화하는 웹 플랫폼.
atoms.dev의 마케팅 버전.

## AI 에이전트 구성

### 핵심 에이전트 (2명)
| 에이전트 | 역할 | 아바타색 |
|---------|------|---------|
| 마쥬 (Maju) | 마케팅 총괄 디렉터 - 30일 플랜, 카피라이팅, A/B테스트 기획 | #FF6B6B (레드) |
| 코쥬 (Koju) | AI 개발 전문가 - 시스템 구축, API 연동, 데이터 분석 | #4ECDC4 (틸) |

### AI 심사위원단 (100명)
5가지 페르소나 그룹:
- 트렌드 민감형 (20%) - 10~20대 틱톡/쇼츠 헤비유저
- 실용주의 가성비형 (30%) - 30~40대 직장인/주부
- 감성 추구형 (20%) - 디자인/무드 중시 인스타그래머
- 분석/의심형 (20%) - 전문가/투자자 성향
- 충동 구매형 (10%) - FOMO 자극에 즉각 반응

## 기술 스택
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **State**: Zustand
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Real-time**: Server-Sent Events (SSE)
- **AI**: OpenAI / Claude / Gemini API (관리자 페이지에서 키 설정)
- **Storage**: localStorage (MVP) → DB 확장 가능

## 페이지 구조
```
/ (랜딩)
/dashboard (메인 대시보드 - Live Studio)
  ├── Panel A: AI Planner Live (마케팅 플랜 실시간 생성)
  ├── Panel B: Creative Factory (카피/이미지 생성 과정)
  ├── Panel C: Jury Arena (100인 투표 실시간)
  └── Panel D: Performance (광고 성과 지표)
/campaign/new (새 캠페인 - 제품 정보 입력)
/campaign/[id] (캠페인 상세)
/agents (AI 직원 목록 및 프로필)
/admin (관리자 - API 키 설정, 시스템 설정)
```

## 데이터 흐름
1. 사용자가 제품 카테고리 + 이름 입력
2. AI가 맞춤형 심층 질문 생성 (적응형 폼)
3. 마쥬가 30일 Daily Plan 생성
4. 코쥬가 각 Day별 크리에이티브 소재 생성
5. 100인 심사위원 블라인드 투표
6. 최고 소재 선별 → A/B 테스트
7. 광고 API 자동 집행 (Meta/Google)
8. 실시간 성과 모니터링 → 피드백 루프
