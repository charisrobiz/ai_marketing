import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET: 주간 리포트 데이터
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!campaign) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const productInfo = JSON.parse(campaign.product_info as string);

  // 주간별 시뮬레이션 데이터
  const weeklyData = [
    {
      week: 1,
      title: '시장 검증 & 초기 유저 확보',
      status: 'completed',
      metrics: {
        newInstalls: 1200,
        totalInstalls: 1200,
        cac: 0,
        totalSpend: 0,
        organicRatio: 85,
        paidRatio: 15,
        topChannel: '인스타 릴스',
        ctr: 4.2,
        cvr: 8.5,
        retention_d1: 72,
        retention_d7: 45,
      },
      highlights: [
        '마이크로 인플루언서 12명 확보 (무료 체험 제공, 현금 지출 0원)',
        '육아 커뮤니티 3곳 시딩 완료 (맘카페, 인스타 육아계정)',
        '릴스 "3초의 기적" 조회수 28,000 달성',
        'SEO 블로그 3편 발행 - "아기 사진 정리 앱" 키워드 구글 2페이지 진입',
      ],
      issues: [
        '앱스토어 스크린샷 CTR이 예상보다 낮음 (개선 필요)',
      ],
      nextActions: [
        'UGC 챌린지 "#3초포토북챌린지" 런칭',
        '소액 A/B 테스트 시작 (10~20만원)',
        '앱스토어 스크린샷 A/B 테스트',
      ],
    },
    {
      week: 2,
      title: '오가닉 성장 & 바이럴',
      status: 'completed',
      metrics: {
        newInstalls: 2600,
        totalInstalls: 3800,
        cac: 450,
        totalSpend: 285000,
        organicRatio: 60,
        paidRatio: 40,
        topChannel: 'UGC 챌린지',
        ctr: 5.1,
        cvr: 9.2,
        retention_d1: 68,
        retention_d7: 42,
      },
      highlights: [
        '#3초포토북챌린지 UGC 87개 생성 (목표 50개 초과 달성)',
        '바이럴형 소재 CPA 380원 달성 (업계 평균 2,000원 대비 81% 절감)',
        '체험단 30명 솔직 후기 작성 완료',
        'A/B 테스트 결과: 바이럴형 > 공감형 > 권위형 순',
      ],
      issues: [
        '공감형 소재 CTR 높지만 전환율 낮음 → CTA 개선 필요',
        'D7 리텐션 42%로 소폭 하락 → 온보딩 개선 검토',
      ],
      nextActions: [
        '바이럴형에 예산 70% 집중 투입',
        '공감형 소재 CTA "무료로 시작하기" → "3초 만에 만들기"로 변경',
        '앱 온보딩 플로우 최적화',
      ],
    },
    {
      week: 3,
      title: '데이터 기반 최적화 & 스케일링',
      status: 'completed',
      metrics: {
        newInstalls: 3400,
        totalInstalls: 7200,
        cac: 680,
        totalSpend: 1580000,
        organicRatio: 35,
        paidRatio: 65,
        topChannel: 'Meta 광고',
        ctr: 4.8,
        cvr: 7.8,
        retention_d1: 70,
        retention_d7: 44,
      },
      highlights: [
        '퍼포먼스 스케일업 성공 - 일 평균 486명 설치',
        '레퍼럴 시스템 가동: 기존 유저 15%가 1명 이상 초대',
        '25-34세 여성 세그먼트에서 CPA 최저 (520원)',
        'SEO 블로그 "첫돌 포토북 만들기" 구글 1페이지 진입',
      ],
      issues: [
        'CPA가 680원으로 상승 - 타겟 피로도 발생',
        '35-44세 확장 시 CPA 1,200원으로 비효율',
      ],
      nextActions: [
        '레퍼럴 인센티브 강화 (친구 초대 시 프리미엄 1개월 무료)',
        '공유 카드 디자인 리뉴얼 - "내 포토북 자랑하기" 감성',
        '리텐션 마케팅 강화 (푸시 알림 + 이메일)',
      ],
    },
    {
      week: 4,
      title: '리텐션 강화 & 목표 달성',
      status: 'completed',
      metrics: {
        newInstalls: 3300,
        totalInstalls: 10500,
        cac: 720,
        totalSpend: 2950000,
        organicRatio: 30,
        paidRatio: 70,
        topChannel: '레퍼럴',
        ctr: 4.5,
        cvr: 7.2,
        retention_d1: 71,
        retention_d7: 46,
        retention_d30: 28,
      },
      highlights: [
        '목표 10,000명 달성! (최종 10,500명)',
        '레퍼럴이 전체 설치의 25% 차지 (K-Factor 1.25)',
        '총 마케팅 비용 약 295만원 (CAC 평균 280원)',
        '"월간 포토북" 구독 전환율 12% 달성',
      ],
      issues: [],
      nextActions: [
        '반려동물 니치로 확장 검토',
        'LTV 최적화 및 수익화 전략 수립',
        '해외 시장 (일본/동남아) 진출 리서치',
      ],
    },
  ];

  // 현재 진행된 주차 확인
  const plans = db.prepare('SELECT DISTINCT week, status FROM daily_plans WHERE campaign_id = ? ORDER BY week').all(id) as Array<{ week: number; status: string }>;
  const completedWeeks = new Set<number>();
  const inProgressWeeks = new Set<number>();
  for (const p of plans) {
    if (p.status === 'completed') completedWeeks.add(p.week);
    if (p.status === 'in_progress') inProgressWeeks.add(p.week);
  }

  // 해당 주차까지만 데이터 공개
  const visibleWeeks = weeklyData.map((w) => ({
    ...w,
    status: completedWeeks.has(w.week) ? 'completed' : inProgressWeeks.has(w.week) ? 'in_progress' : 'pending',
    visible: completedWeeks.has(w.week) || inProgressWeeks.has(w.week),
  }));

  return NextResponse.json({
    campaignId: id,
    productName: productInfo.name,
    weeks: visibleWeeks,
    summary: {
      totalInstalls: Math.max(...weeklyData.filter((w) => completedWeeks.has(w.week) || inProgressWeeks.has(w.week)).map((w) => w.metrics.totalInstalls), 0),
      totalSpend: Math.max(...weeklyData.filter((w) => completedWeeks.has(w.week) || inProgressWeeks.has(w.week)).map((w) => w.metrics.totalSpend), 0),
      avgCac: weeklyData.filter((w) => completedWeeks.has(w.week) && w.metrics.cac > 0).reduce((sum, w) => sum + w.metrics.cac, 0) / Math.max(weeklyData.filter((w) => completedWeeks.has(w.week) && w.metrics.cac > 0).length, 1),
      completedWeeks: completedWeeks.size,
    },
  });
}
