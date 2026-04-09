import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';
import { logLLMUsage } from '@/lib/usage/tracker';

async function getSettings() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  let modelOverrides: Record<string, string> = {};
  for (const r of rows || []) {
    if (r.key === 'modelOverrides') {
      try { modelOverrides = JSON.parse(r.value); } catch { /* */ }
    } else {
      map[r.key] = r.value;
    }
  }
  return { ...map, modelOverrides } as Record<string, string> & { modelOverrides: Record<string, string> };
}

async function addEvent(campaignId: string, agentId: string, agentName: string, type: string, content: string) {
  await supabase.from('live_events').insert({
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    agent_id: agentId,
    agent_name: agentName,
    type,
    content,
  });
}

// POST: 본부장 하나의 소재 검토 실행
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const settings = await getSettings();

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const mode = (campaign.campaign_mode || 'production') as 'demo' | 'production';
  const productInfo = campaign.product_info;
  const { data: creatives } = await supabase.from('creatives').select('*').eq('campaign_id', campaignId);

  // production 모드는 LLM 키 필수
  if (mode === 'production') {
    const hasLLMKey = settings.openaiApiKey || settings.claudeApiKey || settings.geminiApiKey;
    if (!hasLLMKey) {
      return NextResponse.json({ error: '본부장 검토에는 AI LLM API 키가 필요합니다.' }, { status: 400 });
    }
  }

  if (!creatives || creatives.length === 0) return NextResponse.json({ error: 'No creatives' }, { status: 400 });

  // 기존 리뷰 삭제 (재검토)
  await supabase.from('creative_reviews').delete().eq('campaign_id', campaignId);

  await addEvent(campaignId, 'hana', '하나', 'chat', `소재 검토를 시작합니다. ${creatives.length}개 소재를 하나씩 확인할게요.`);

  let approvedCount = 0;
  let revisionCount = 0;
  let rejectedCount = 0;

  for (const creative of creatives) {
    const hookingText = creative.hooking_text;
    const copyText = creative.copy_text;
    const angle = creative.angle;
    const platform = creative.platform;

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
      }, prompt, 'analysis', settings.modelOverrides?.['review']);

      await logLLMUsage({ campaignId, agentId: 'hana', agentName: '하나', phase: 'review', taskDescription: `소재 검토 (${creative.angle})`, mode }, response);
      reviewResult = parseJSONResponse(response.content);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      if (mode === 'production') {
        // production은 에러 반환
        return NextResponse.json({ error: `본부장 검토 실패: ${errMsg}` }, { status: 500 });
      }
      // demo 모드만 fallback
      const { data: voteData } = await supabase.from('votes').select('score').eq('creative_id', creative.id);
      const avgScore = voteData && voteData.length > 0
        ? voteData.reduce((sum, v) => sum + v.score, 0) / voteData.length
        : 7;
      const score = Math.round(avgScore);

      reviewResult = {
        score,
        brand_consistency: Math.min(10, score + 1),
        target_fit: score,
        cost_efficiency: Math.min(10, score),
        status: score >= 7 ? 'approved' : score >= 4 ? 'revision_requested' : 'rejected',
        comment: score >= 7 ? '[데모] 평가 우수' : score >= 4 ? '[데모] 카피 보강 필요' : '[데모] 컨셉 재검토',
        revision_note: score < 7 ? '후킹 문구의 임팩트를 강화하고, CTA를 더 명확하게 수정해주세요.' : '',
      };
    }

    const ceoApprovalLevel = settings.ceoApprovalLevel || 'ceo_final';
    const ceoStatus = reviewResult.status === 'approved'
      ? (ceoApprovalLevel === 'auto' ? 'approved' : 'pending')
      : 'pending';

    await supabase.from('creative_reviews').insert({
      id: crypto.randomUUID(),
      campaign_id: campaignId,
      creative_id: creative.id,
      reviewer: 'hana',
      reviewer_name: '하나',
      status: reviewResult.status,
      score: reviewResult.score,
      brand_consistency: reviewResult.brand_consistency,
      target_fit: reviewResult.target_fit,
      cost_efficiency: reviewResult.cost_efficiency,
      comment: reviewResult.comment,
      revision_note: reviewResult.revision_note || null,
      ceo_status: ceoStatus,
      reviewed_at: new Date().toISOString(),
    });

    if (reviewResult.status === 'approved') approvedCount++;
    else if (reviewResult.status === 'revision_requested') revisionCount++;
    else rejectedCount++;

    const statusEmoji = reviewResult.status === 'approved' ? '✅' : reviewResult.status === 'revision_requested' ? '📝' : '❌';
    await addEvent(campaignId, 'hana', '하나', 'chat',
      `${statusEmoji} "${angle}" (${platform}) - ${reviewResult.comment} [${reviewResult.score}/10]`
    );
  }

  // 종합 리포트
  await addEvent(campaignId, 'hana', '하나', 'system',
    `소재 검토 완료! ✅ 승인 ${approvedCount}개 / 📝 수정요청 ${revisionCount}개 / ❌ 반려 ${rejectedCount}개`
  );

  if (revisionCount > 0) {
    await addEvent(campaignId, 'hana', '하나', 'chat',
      `수정 요청한 소재가 ${revisionCount}개 있습니다. 담당자분들 수정사항 확인하고 재작업 부탁드려요!`
    );
    await addEvent(campaignId, 'jiwoo', '지우', 'chat', `네 본부장님! 수정 사항 확인하고 바로 반영하겠습니다.`);
    await addEvent(campaignId, 'yuna', '유나', 'chat', `비주얼도 함께 조정할게요.`);
  }

  const ceoLevel = settings.ceoApprovalLevel || 'ceo_final';
  if (ceoLevel === 'ceo_final' && approvedCount > 0) {
    await addEvent(campaignId, 'hana', '하나', 'chat',
      `승인된 ${approvedCount}개 소재는 CEO 최종 승인 대기 중입니다. 승인 대시보드에서 확인해주세요!`
    );
  } else if (ceoLevel === 'ceo_notify' && approvedCount > 0) {
    await addEvent(campaignId, 'hana', '하나', 'system',
      `승인된 ${approvedCount}개 소재가 자동 집행됩니다. CEO에게 알림을 발송했습니다.`
    );
  }

  return NextResponse.json({ approved: approvedCount, revision: revisionCount, rejected: rejectedCount });
}

// GET: 리뷰 결과 조회
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;

  const { data: reviews } = await supabase
    .from('creative_reviews')
    .select('*, creatives(angle, hooking_text, copy_text, platform, image_prompt)')
    .eq('campaign_id', campaignId)
    .order('score', { ascending: false });

  const flatReviews = (reviews || []).map((r) => {
    const creative = r.creatives as Record<string, unknown> | null;
    return {
      ...r,
      angle: creative?.angle,
      hooking_text: creative?.hooking_text,
      copy_text: creative?.copy_text,
      platform: creative?.platform,
      image_prompt: creative?.image_prompt,
      creatives: undefined,
    };
  });

  const { data: allReviewIds } = await supabase
    .from('creative_reviews')
    .select('creative_id')
    .eq('campaign_id', campaignId);

  const creativeIds = (allReviewIds || []).map((r) => r.creative_id);
  const { data: history } = creativeIds.length > 0
    ? await supabase.from('revision_history').select('*').in('creative_id', creativeIds).order('created_at', { ascending: false })
    : { data: [] };

  return NextResponse.json({ reviews: flatReviews, history: history || [] });
}
