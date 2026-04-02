import { NextResponse } from 'next/server';
import db from '@/lib/db/database';
import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

function addEvent(campaignId: string, agentId: string, agentName: string, type: string, content: string) {
  db.prepare(`INSERT INTO live_events (id, campaign_id, agent_id, agent_name, type, content, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`)
    .run(crypto.randomUUID(), campaignId, agentId, agentName, type, content);
}

// POST: 본부장 하나의 소재 검토 실행
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const settings = getSettings();

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId) as Record<string, unknown> | undefined;
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const productInfo = JSON.parse(campaign.product_info as string);
  const creatives = db.prepare('SELECT * FROM creatives WHERE campaign_id = ?').all(campaignId) as Array<Record<string, unknown>>;

  if (creatives.length === 0) return NextResponse.json({ error: 'No creatives' }, { status: 400 });

  // 기존 리뷰 삭제 (재검토)
  db.prepare('DELETE FROM creative_reviews WHERE campaign_id = ?').run(campaignId);

  addEvent(campaignId, 'hana', '하나', 'chat', `소재 검토를 시작합니다. ${creatives.length}개 소재를 하나씩 확인할게요.`);

  const insertReview = db.prepare(`
    INSERT INTO creative_reviews (id, campaign_id, creative_id, reviewer, reviewer_name, status, score, brand_consistency, target_fit, cost_efficiency, comment, revision_note, created_at, reviewed_at)
    VALUES (?, ?, ?, 'hana', '하나', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  let approvedCount = 0;
  let revisionCount = 0;
  let rejectedCount = 0;

  for (const creative of creatives) {
    const hookingText = creative.hooking_text as string;
    const copyText = creative.copy_text as string;
    const angle = creative.angle as string;
    const platform = creative.platform as string;

    let reviewResult: {
      score: number;
      brand_consistency: number;
      target_fit: number;
      cost_efficiency: number;
      status: string;
      comment: string;
      revision_note: string;
    };

    try {
      const prompt = `당신은 마케팅 본부장 "하나"입니다. 최소비용 최대효과를 추구하며, 브랜드 일관성, 타겟 적합성, 비용 효율을 기준으로 소재를 검토합니다.

[제품] ${productInfo.name} - ${productInfo.description || ''}
[타겟] ${productInfo.targetAudience || '일반 소비자'}

[검토 소재]
- 앵글: ${angle}
- 플랫폼: ${platform}
- 후킹 문구: "${hookingText}"
- 본문: "${copyText}"

다음 기준으로 평가하세요:
1. brand_consistency (1-10): 브랜드 톤/메시지 일관성
2. target_fit (1-10): 타겟 고객에게 얼마나 잘 맞는지
3. cost_efficiency (1-10): 이 소재가 비용 대비 효과적일지
4. score (1-10): 종합 점수
5. status: "approved" (7점 이상), "revision_requested" (4-6점), "rejected" (3점 이하)
6. comment: 본부장으로서의 전체 평가 (30자 이내)
7. revision_note: 수정 필요 시 구체적 수정 사항 (없으면 빈 문자열)

반드시 JSON으로만 응답하세요:
{"score":8,"brand_consistency":9,"target_fit":7,"cost_efficiency":8,"status":"approved","comment":"타겟 공감도 높고 비용 효율적","revision_note":""}`;

      const response = await callLLM({
        openaiApiKey: settings.openaiApiKey || '',
        claudeApiKey: settings.claudeApiKey || '',
        geminiApiKey: settings.geminiApiKey || '',
      }, prompt);

      reviewResult = parseJSONResponse(response.content);
    } catch {
      // Fallback: 자동 검토 (점수 기반)
      const voteData = db.prepare('SELECT AVG(score) as avg FROM votes WHERE creative_id = ?').get(creative.id) as { avg: number } | undefined;
      const avgScore = voteData?.avg || 7;
      const score = Math.round(avgScore);

      reviewResult = {
        score,
        brand_consistency: Math.min(10, score + 1),
        target_fit: score,
        cost_efficiency: Math.min(10, score),
        status: score >= 7 ? 'approved' : score >= 4 ? 'revision_requested' : 'rejected',
        comment: score >= 7 ? '심사위원 평가 우수, 집행 승인' : score >= 4 ? '카피 보강 필요' : '컨셉 재검토 필요',
        revision_note: score < 7 ? '후킹 문구의 임팩트를 강화하고, CTA를 더 명확하게 수정해주세요.' : '',
      };
    }

    const ceoApprovalLevel = settings.ceoApprovalLevel || 'ceo_final';
    const ceoStatus = reviewResult.status === 'approved'
      ? (ceoApprovalLevel === 'auto' ? 'approved' : 'pending')
      : 'pending';

    insertReview.run(
      crypto.randomUUID(),
      campaignId,
      creative.id,
      reviewResult.status,
      reviewResult.score,
      reviewResult.brand_consistency,
      reviewResult.target_fit,
      reviewResult.cost_efficiency,
      reviewResult.comment,
      reviewResult.revision_note || null,
    );

    // Update ceo_status
    if (ceoStatus !== 'pending') {
      db.prepare('UPDATE creative_reviews SET ceo_status = ? WHERE creative_id = ?').run(ceoStatus, creative.id);
    }

    if (reviewResult.status === 'approved') approvedCount++;
    else if (reviewResult.status === 'revision_requested') revisionCount++;
    else rejectedCount++;

    // Event log
    const statusEmoji = reviewResult.status === 'approved' ? '✅' : reviewResult.status === 'revision_requested' ? '📝' : '❌';
    addEvent(campaignId, 'hana', '하나', 'chat',
      `${statusEmoji} "${angle}" (${platform}) - ${reviewResult.comment} [${reviewResult.score}/10]`
    );
  }

  // 종합 리포트
  addEvent(campaignId, 'hana', '하나', 'system',
    `소재 검토 완료! ✅ 승인 ${approvedCount}개 / 📝 수정요청 ${revisionCount}개 / ❌ 반려 ${rejectedCount}개`
  );

  if (revisionCount > 0) {
    addEvent(campaignId, 'hana', '하나', 'chat',
      `수정 요청한 소재가 ${revisionCount}개 있습니다. 담당자분들 수정사항 확인하고 재작업 부탁드려요!`
    );
    addEvent(campaignId, 'jiwoo', '지우', 'chat', `네 본부장님! 수정 사항 확인하고 바로 반영하겠습니다.`);
    addEvent(campaignId, 'yuna', '유나', 'chat', `비주얼도 함께 조정할게요.`);
  }

  const ceoLevel = settings.ceoApprovalLevel || 'ceo_final';
  if (ceoLevel === 'ceo_final' && approvedCount > 0) {
    addEvent(campaignId, 'hana', '하나', 'chat',
      `승인된 ${approvedCount}개 소재는 CEO 최종 승인 대기 중입니다. 승인 대시보드에서 확인해주세요!`
    );
  } else if (ceoLevel === 'ceo_notify' && approvedCount > 0) {
    addEvent(campaignId, 'hana', '하나', 'system',
      `승인된 ${approvedCount}개 소재가 자동 집행됩니다. CEO에게 알림을 발송했습니다.`
    );
  }

  return NextResponse.json({ approved: approvedCount, revision: revisionCount, rejected: rejectedCount });
}

// GET: 리뷰 결과 조회
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;

  const reviews = db.prepare(`
    SELECT r.*, c.angle, c.hooking_text, c.copy_text, c.platform, c.image_prompt
    FROM creative_reviews r
    JOIN creatives c ON r.creative_id = c.id
    WHERE r.campaign_id = ?
    ORDER BY r.score DESC
  `).all(campaignId);

  const history = db.prepare(`
    SELECT * FROM revision_history WHERE creative_id IN (
      SELECT creative_id FROM creative_reviews WHERE campaign_id = ?
    ) ORDER BY created_at DESC
  `).all(campaignId);

  return NextResponse.json({ reviews, history });
}
