import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET: 주간 리포트 데이터
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', id).single();
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const productInfo = campaign.product_info;

  const weeklyData = [
    {
      week: 1, title: '시장 검증 & 초기 유저 확보', status: 'completed',
      metrics: { newInstalls: 1200, totalInstalls: 1200, cac: 0, totalSpend: 0, organicRatio: 85, paidRatio: 15, topChannel: '인스타 릴스', ctr: 4.2, cvr: 8.5, retention_d1: 72, retention_d7: 45 },
      highlights: ['마이크로 인플루언서 12명 확보 (무료 체험 제공, 현금 지출 0원)', '육아 커뮤니티 3곳 시딩 완료', '릴스 "3초의 기적" 조회수 28,000 달성', 'SEO 블로그 3편 발행'],
      issues: ['앱스토어 스크린샷 CTR이 예상보다 낮음'],
      nextActions: ['UGC 챌린지 런칭', '소액 A/B 테스트 시작', '앱스토어 스크린샷 A/B 테스트'],
    },
    {
      week: 2, title: '오가닉 성장 & 바이럴', status: 'completed',
      metrics: { newInstalls: 2600, totalInstalls: 3800, cac: 450, totalSpend: 285000, organicRatio: 60, paidRatio: 40, topChannel: 'UGC 챌린지', ctr: 5.1, cvr: 9.2, retention_d1: 68, retention_d7: 42 },
      highlights: ['#3초포토북챌린지 UGC 87개 생성', '바이럴형 소재 CPA 380원 달성', '체험단 30명 후기 완료', 'A/B 테스트 결과 확인'],
      issues: ['공감형 소재 CTR 높지만 전환율 낮음', 'D7 리텐션 42%로 소폭 하락'],
      nextActions: ['바이럴형에 예산 70% 집중', '공감형 CTA 변경', '앱 온보딩 최적화'],
    },
    {
      week: 3, title: '데이터 기반 최적화 & 스케일링', status: 'completed',
      metrics: { newInstalls: 3400, totalInstalls: 7200, cac: 680, totalSpend: 1580000, organicRatio: 35, paidRatio: 65, topChannel: 'Meta 광고', ctr: 4.8, cvr: 7.8, retention_d1: 70, retention_d7: 44 },
      highlights: ['퍼포먼스 스케일업 성공', '레퍼럴 시스템 가동: 15% 초대', '25-34세 여성 CPA 최저 (520원)', 'SEO 블로그 구글 1페이지 진입'],
      issues: ['CPA 680원으로 상승', '35-44세 확장 시 비효율'],
      nextActions: ['레퍼럴 인센티브 강화', '공유 카드 디자인 리뉴얼', '리텐션 마케팅 강화'],
    },
    {
      week: 4, title: '리텐션 강화 & 목표 달성', status: 'completed',
      metrics: { newInstalls: 3300, totalInstalls: 10500, cac: 720, totalSpend: 2950000, organicRatio: 30, paidRatio: 70, topChannel: '레퍼럴', ctr: 4.5, cvr: 7.2, retention_d1: 71, retention_d7: 46, retention_d30: 28 },
      highlights: ['목표 10,000명 달성! (최종 10,500명)', '레퍼럴 25% 차지', '총 마케팅 비용 약 295만원', '"월간 포토북" 구독 전환율 12%'],
      issues: [],
      nextActions: ['반려동물 니치로 확장 검토', 'LTV 최적화', '해외 시장 리서치'],
    },
  ];

  const { data: plans } = await supabase
    .from('daily_plans')
    .select('week, status')
    .eq('campaign_id', id);

  const completedWeeks = new Set<number>();
  const inProgressWeeks = new Set<number>();
  for (const p of plans || []) {
    if (p.status === 'completed') completedWeeks.add(p.week);
    if (p.status === 'in_progress') inProgressWeeks.add(p.week);
  }

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
