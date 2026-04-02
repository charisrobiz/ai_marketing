import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

function addEvent(campaignId: string, agentId: string, agentName: string, type: string, content: string) {
  db.prepare(`
    INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(crypto.randomUUID(), campaignId, agentId, agentName, type, content);
}

// POST: 주간 리뷰 미팅 실행
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const body = await request.json();
  const { currentWeek } = body; // 1, 2, 3, or 4

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId) as Record<string, unknown> | undefined;
  if (!campaign) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const productInfo = JSON.parse(campaign.product_info as string);
  const nextWeek = currentWeek + 1;

  // === 주간 리뷰 미팅 ===
  addEvent(campaignId, 'hana', '하나', 'chat', `팀 여러분, Week ${currentWeek} 리뷰 미팅 시작합니다. 각자 결과 보고해주세요.`);

  // 성과 데이터 (시뮬레이션)
  const metricsMap: Record<number, { installs: number; cac: number; organic: number; paid: number; topChannel: string }> = {
    1: { installs: 1200, cac: 0, organic: 85, paid: 15, topChannel: '인스타 릴스' },
    2: { installs: 3800, cac: 450, organic: 60, paid: 40, topChannel: 'UGC 챌린지' },
    3: { installs: 7200, cac: 680, organic: 35, paid: 65, topChannel: 'Meta 광고' },
    4: { installs: 10500, cac: 720, organic: 30, paid: 70, topChannel: '레퍼럴' },
  };
  const weekMetrics = metricsMap[currentWeek] || { installs: 0, cac: 0, organic: 50, paid: 50, topChannel: '-' };

  // 은지: 데이터 보고
  addEvent(campaignId, 'eunji', '은지', 'chat', `Week ${currentWeek} 데이터 보고합니다. 누적 설치: ${weekMetrics.installs.toLocaleString()}명, CAC: ${weekMetrics.cac === 0 ? '0원(오가닉 100%)' : `${weekMetrics.cac}원`}, 오가닉/페이드 비율: ${weekMetrics.organic}%/${weekMetrics.paid}%.`);
  addEvent(campaignId, 'eunji', '은지', 'chat', `가장 성과 좋은 채널은 "${weekMetrics.topChannel}"이었습니다. ${currentWeek <= 2 ? 'CTR이 기대 이상이에요.' : '전환율이 안정화되고 있습니다.'}`);

  // 민서: 전략 분석
  if (currentWeek === 1) {
    addEvent(campaignId, 'minseo', '민서', 'chat', `Week 1 결과가 좋습니다! 오가닉 비율 ${weekMetrics.organic}%는 예상보다 높아요. 니치 타겟팅이 효과를 보고 있습니다.`);
    addEvent(campaignId, 'taeyang', '태양', 'chat', `동의합니다. 아직 광고비를 거의 안 쓰고 ${weekMetrics.installs.toLocaleString()}명이면 훌륭해요. Week 2에서 UGC 챌린지로 더 폭발시키죠.`);
    addEvent(campaignId, 'minseo', '민서', 'chat', `다만 주의할 점은, 오가닉만으로는 1만명이 힘들어요. Week 2 중반부터 소액 퍼포먼스 테스트를 시작하는 게 좋겠습니다.`);
    addEvent(campaignId, 'taeyang', '태양', 'chat', `그렇죠. 10~20만원으로 A/B 테스트 먼저 돌려볼게요. 위너 소재를 찾아놓으면 Week 3 스케일업이 수월합니다.`);
  } else if (currentWeek === 2) {
    addEvent(campaignId, 'minseo', '민서', 'chat', `UGC 챌린지가 기대 이상으로 잘 됐어요! 근데 ${weekMetrics.cac}원 CAC가 아직 개선 여지가 있어요.`);
    addEvent(campaignId, 'jiwoo', '지우', 'chat', `SEO 유입이 아직 본격화되지 않았어요. 블로그 콘텐츠가 인덱싱되기 시작하면 2주 후부터 오가닉 유입이 올라갈 겁니다.`);
    addEvent(campaignId, 'yuna', '유나', 'chat', `비주얼 관점에서 하나 제안. 공감형 소재가 CTR은 높은데 전환이 낮아요. CTA를 더 명확하게 바꿔볼까요?`);
    addEvent(campaignId, 'doha', '도하', 'chat', `유나님 좋은 포인트! 숏폼 끝에 앱 설치 화면을 직접 보여주는 버전을 만들어볼게요. 전환율 올라갈 거예요.`);
    addEvent(campaignId, 'taeyang', '태양', 'chat', `은지님, A/B 테스트 결과 어떤 소재가 가장 CPA 낮았어요?`);
    addEvent(campaignId, 'eunji', '은지', 'chat', `바이럴형이 CPA 380원으로 최저, 공감형이 520원, 권위형이 890원이에요. 바이럴형에 예산 집중 추천합니다.`);
    addEvent(campaignId, 'minseo', '민서', 'chat', `좋아요. Week 3는 바이럴형 소재에 예산 70% 집중하고, 공감형에 20%, 나머지 테스트에 10% 배분할게요.`);
  } else if (currentWeek === 3) {
    addEvent(campaignId, 'minseo', '민서', 'chat', `스케일업이 잘 되고 있습니다! 7,200명 달성. 근데 CAC가 ${weekMetrics.cac}원으로 올라가고 있어요. 타겟 피로도가 생기는 것 같습니다.`);
    addEvent(campaignId, 'taeyang', '태양', 'chat', `맞아요. 같은 타겟에 계속 노출하면 CTR이 떨어져요. 이제 인접 타겟으로 확장할 타이밍입니다.`);
    addEvent(campaignId, 'hana', '하나', 'chat', `인접 타겟으로 확장하면서도 비용 효율을 유지하려면? 레퍼럴 시스템을 본격 가동하면 어떨까요?`);
    addEvent(campaignId, 'siwon', '시원', 'chat', `레퍼럴 시스템 데이터 보니까, 기존 유저의 15%가 1명 이상 초대했어요. 인센티브를 강화하면 K-Factor 1.3까지 올릴 수 있을 것 같습니다.`);
    addEvent(campaignId, 'minseo', '민서', 'chat', `좋아요! Week 4는 레퍼럴 강화 + 리텐션에 집중하겠습니다. 신규보다 기존 유저의 LTV를 올리는 게 비용 효율적이에요.`);
    addEvent(campaignId, 'yuna', '유나', 'chat', `레퍼럴용 공유 카드 디자인 새로 만들어야 해요. "내 포토북 자랑하기" 같은 감성으로 가면 공유율 올라갈 거예요.`);
  } else {
    addEvent(campaignId, 'minseo', '민서', 'chat', `축하합니다! 목표 10,000명을 달성했습니다! 최종 CAC ${weekMetrics.cac}원, 총 마케팅 비용 약 ${Math.round(weekMetrics.installs * weekMetrics.cac / 10000)}만원.`);
    addEvent(campaignId, 'eunji', '은지', 'chat', `채널별 기여도: 오가닉 ${weekMetrics.organic}%, 퍼포먼스 광고 ${weekMetrics.paid}%. 레퍼럴이 전체의 약 25%를 차지했습니다.`);
    addEvent(campaignId, 'taeyang', '태양', 'chat', `다음 단계로 리텐션 마케팅과 LTV 최적화에 들어가면 좋겠습니다. 수익화 전략 논의가 필요해요.`);
    addEvent(campaignId, 'hana', '하나', 'chat', `모든 팀원 정말 수고하셨습니다! "${productInfo.name}" 캠페인 대성공이에요. 다음 스테이지 전략은 별도 미팅으로 잡겠습니다.`);
  }

  // 하나 마무리
  if (nextWeek <= 4) {
    addEvent(campaignId, 'hana', '하나', 'system', `Week ${currentWeek} 리뷰 완료. 피드백 반영하여 Week ${nextWeek} 진행합니다. ${nextWeek === 4 ? '마지막 주, 목표 달성에 집중!' : ''}`);

    // Week plans 상태 업데이트
    db.prepare('UPDATE daily_plans SET status = ? WHERE campaign_id = ? AND week = ?').run('completed', campaignId, currentWeek);
    db.prepare('UPDATE daily_plans SET status = ? WHERE campaign_id = ? AND week = ?').run('in_progress', campaignId, nextWeek);
  } else {
    addEvent(campaignId, 'hana', '하나', 'system', `4주 캠페인 완료! 최종 결과를 대시보드에서 확인하세요.`);
    db.prepare('UPDATE daily_plans SET status = ? WHERE campaign_id = ? AND week = ?').run('completed', campaignId, currentWeek);
    db.prepare('UPDATE campaigns SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('completed', campaignId);
  }

  return NextResponse.json({ currentWeek, nextWeek: nextWeek <= 4 ? nextWeek : null, metrics: weekMetrics });
}
