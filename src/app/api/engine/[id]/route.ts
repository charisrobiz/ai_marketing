import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { buildPlanPrompt, buildCreativePrompt, buildJuryVotePrompt } from '@/lib/ai/prompts';
import { callLLM, parseJSONResponse } from '@/lib/ai/llmClient';
import { JURY_PERSONAS } from '@/data/juryPersonas';
import { generateImage } from '@/lib/media/imageGenerator';
import { generateVideo } from '@/lib/media/videoGenerator';
import { fetchFigmaTemplate } from '@/lib/media/figmaClient';
import { composeBanner } from '@/lib/media/bannerComposer';
import type { ProductInfo, CampaignOptions, CampaignMedia, MediaContent } from '@/types';
import { CAMPAIGN_TYPE_CONFIG } from '@/types';

async function getSettings() {
  const { data: rows } = await supabase.from('settings').select('key, value');
  const map: Record<string, string> = {};
  for (const r of rows || []) map[r.key] = r.value;
  return {
    openaiApiKey: map['openaiApiKey'] || '',
    claudeApiKey: map['claudeApiKey'] || '',
    geminiApiKey: map['geminiApiKey'] || '',
    runwayApiKey: map['runwayApiKey'] || '',
    figmaApiKey: map['figmaApiKey'] || '',
  };
}

async function addEvent(campaignId: string, agentId: string, agentName: string, type: string, content: string) {
  const id = crypto.randomUUID();
  await supabase.from('live_events').insert({ id, campaign_id: campaignId, agent_id: agentId, agent_name: agentName, type, content });
  return id;
}

async function addTask(campaignId: string, agentId: string, agentName: string, title: string, description: string, status = 'pending') {
  const id = crypto.randomUUID();
  await supabase.from('agent_tasks').insert({ id, campaign_id: campaignId, agent_id: agentId, agent_name: agentName, title, description, status });
  return id;
}

async function updateTask(id: string, status: string, result?: string) {
  const updates: Record<string, unknown> = { status };
  if (status === 'completed') {
    updates.result = result || null;
    updates.completed_at = new Date().toISOString();
  }
  await supabase.from('agent_tasks').update(updates).eq('id', id);
}

async function updateCampaignStatus(id: string, status: string) {
  await supabase.from('campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
}

// POST: 캠페인 엔진 실행
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;

  const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  const productInfo: ProductInfo = campaign.product_info as unknown as ProductInfo;
  const options: CampaignOptions = (campaign.options as unknown as CampaignOptions) || { generateImage: false, generateVideo: false };
  const settings = await getSettings();

  // 캠페인 미디어 조회
  const { data: mediaRows } = await supabase.from('campaign_media').select('*').eq('campaign_id', campaignId).order('sort_order');
  const campaignMedia: CampaignMedia[] = (mediaRows || []).map((m) => ({
    ...m,
    parsedContent: m.content ? JSON.parse(m.content) as MediaContent : null,
  }));

  // 미디어 용도별 분류
  const videoSources = campaignMedia.filter((m) => m.parsedContent?.usage_intent === 'video_source');
  const imageRefs = campaignMedia.filter((m) => ['ad_image_reference', 'background_source', 'app_screenshot'].includes(m.parsedContent?.usage_intent || ''));

  // === 하나(본부장) 니치밴딩 브리핑 ===
  const typeConfig = CAMPAIGN_TYPE_CONFIG[options.campaignType || 'standard'];
  await addEvent(campaignId, 'hana', '하나', 'chat', `팀 여러분, "${productInfo.name}" 캠페인 킥오프 미팅을 시작합니다!`);
  await addEvent(campaignId, 'hana', '하나', 'chat', `${typeConfig.emoji} 이번 캠페인은 "${typeConfig.label}" (${typeConfig.days}일)입니다. ${typeConfig.description}`);
  await addEvent(campaignId, 'hana', '하나', 'chat', `니치밴딩(Niche Banding) 전략을 기본으로, 캠페인 기간에 맞게 전략을 최적화합니다.`);
  await addEvent(campaignId, 'hana', '하나', 'chat', `니치밴딩 5원칙: 1)극도의 세분화 2)깊이>넓이 3)커뮤니티 중심 성장 4)권위 구축 5)볼링핀 확장 전략`);
  await addEvent(campaignId, 'hana', '하나', 'chat', `"${productInfo.targetAudience || '타겟 미정'}"을 더 깊이 세분화해서, 핵심 니치를 찾아야 합니다.`);
  await addEvent(campaignId, 'hana', '하나', 'chat', `차별점은 "${productInfo.uniqueValue || productInfo.description}"입니다. 소수에게 필수적인 포지셔닝으로 가겠습니다.`);

  await addEvent(campaignId, 'minseo', '민서', 'chat', `네 본부장님! 니치밴딩 1단계(니치 발견)부터 시작하겠습니다.`);
  await addEvent(campaignId, 'jiwoo', '지우', 'chat', `니치 롱테일 키워드 리서치 들어갑니다!`);
  await addEvent(campaignId, 'yuna', '유나', 'chat', `니치 서브컬처 코드 분석 시작합니다!`);
  await addEvent(campaignId, 'doha', '도하', 'chat', `니치 감성 숏폼 콘텐츠 기획할게요.`);
  await addEvent(campaignId, 'taeyang', '태양', 'chat', `니치 타겟 리타겟팅 세팅 준비합니다!`);
  await addEvent(campaignId, 'siwon', '시원', 'chat', `파이프라인 준비 완료.`);
  await addEvent(campaignId, 'eunji', '은지', 'chat', `니치 세그먼트별 반응 분석 대시보드 세팅 완료했습니다!`);

  await addEvent(campaignId, 'hana', '하나', 'system', `니치밴딩 전략 기반 업무를 할당합니다.`);

  const taskPlan = await addTask(campaignId, 'minseo', '민서', '니치밴딩 30일 플랜 수립', '니치 발견→진입→장악→확장 4단계 기반', 'in_progress');
  const taskSeo = await addTask(campaignId, 'jiwoo', '지우', '니치 롱테일 키워드 & SEO 카피', '니치 롱테일 키워드 리서치, 커뮤니티 언어 기반 카피', 'pending');
  const taskVisual = await addTask(campaignId, 'yuna', '유나', '니치 서브컬처 비주얼 컨셉', '안티-제네릭 디자인', 'pending');
  const taskMotion = await addTask(campaignId, 'doha', '도하', '니치 감성 숏폼 콘텐츠', '틱톡/릴스, UGC 챌린지용 템플릿', 'pending');
  const taskPerf = await addTask(campaignId, 'taeyang', '태양', '니치 리타겟팅 & 마이크로 광고', '니치 관심사 기반 세그먼트', 'pending');
  const taskData = await addTask(campaignId, 'eunji', '은지', '니치 세그먼트 투표 분석', '100인 심사위원 투표 집계', 'pending');
  const taskDev = await addTask(campaignId, 'siwon', '시원', 'AI 파이프라인 & 커뮤니티 데이터', 'LLM API 연동', 'in_progress');

  // === Phase 1: 마케팅 플랜 생성 ===
  await updateCampaignStatus(campaignId, 'planning');
  await addEvent(campaignId, 'minseo', '민서', 'plan', `니치밴딩 프레임워크 기반 30일 플랜 생성을 시작합니다.`);

  let plans;
  try {
    const prompt = buildPlanPrompt(productInfo, campaignMedia, options.campaignType || 'standard');
    const response = await callLLM(settings, prompt);
    plans = parseJSONResponse<Array<{ day: number; week: number; title: string; description: string; channels: string[]; target: string; goal: string }>>(response.content);
    await addEvent(campaignId, 'minseo', '민서', 'plan', `니치밴딩 기반 30일 플랜 완료! ${plans.length}일치 (${response.model})`);
    await addEvent(campaignId, 'hana', '하나', 'chat', `민서님 니치밴딩 플랜 확인했습니다. 세분화 타겟팅 훌륭해요!`);
  } catch (err) {
    await addEvent(campaignId, 'minseo', '민서', 'system', `API 오류로 데모 플랜을 사용합니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    plans = generateDemoPlan(productInfo.name);
  }

  // Save plans
  const planRows = plans.map((p) => ({
    campaign_id: campaignId, day: p.day, week: p.week, title: p.title,
    description: p.description, channels: JSON.stringify(p.channels), target: p.target, goal: p.goal, status: 'pending',
  }));
  await supabase.from('daily_plans').insert(planRows);
  await updateTask(taskPlan, 'completed', `${plans.length}일 플랜 생성 완료`);

  // === Phase 2: 크리에이티브 소재 생성 ===
  await updateCampaignStatus(campaignId, 'creating');
  await updateTask(taskSeo, 'in_progress');
  await updateTask(taskVisual, 'in_progress');

  await addEvent(campaignId, 'jiwoo', '지우', 'creative', `니치 롱테일 키워드 기반 SEO 카피 작성 시작!`);
  await addEvent(campaignId, 'yuna', '유나', 'creative', `니치 서브컬처 코드 분석 완료!`);
  await addEvent(campaignId, 'doha', '도하', 'chat', `유나님 비주얼 코드 나오면 UGC 챌린지용 모션 템플릿도 바로 기획합니다!`);

  const selectedPlans = plans.slice(0, 3);
  const platforms = ['instagram', 'tiktok', 'youtube'];
  let totalCreatives = 0;
  const allCreativeRows: Array<Record<string, unknown>> = [];

  for (const plan of selectedPlans) {
    const platform = platforms[plan.day % platforms.length];
    await addEvent(campaignId, 'jiwoo', '지우', 'creative', `Day ${plan.day} "${plan.title}" - ${platform} 카피 작성 중...`);

    let creatives;
    try {
      const prompt = buildCreativePrompt(productInfo, plan.day, plan.title, platform, campaignMedia);
      const response = await callLLM(settings, prompt);
      creatives = parseJSONResponse<Array<{ angle: string; hookingText: string; copyText: string; imagePrompt?: string }>>(response.content);
    } catch {
      creatives = generateDemoCreatives();
    }

    for (const c of creatives) {
      allCreativeRows.push({
        id: crypto.randomUUID(), campaign_id: campaignId, angle: c.angle,
        copy_text: c.copyText, hooking_text: c.hookingText, image_prompt: c.imagePrompt || null, platform,
      });
      totalCreatives++;
    }

    await addEvent(campaignId, 'yuna', '유나', 'creative', `Day ${plan.day} 비주얼 ${creatives.length}개 감수 완료!`);
  }

  if (allCreativeRows.length > 0) {
    await supabase.from('creatives').insert(allCreativeRows);
  }

  await addEvent(campaignId, 'jiwoo', '지우', 'creative', `총 ${totalCreatives}개 카피 완성!`);
  await addEvent(campaignId, 'yuna', '유나', 'creative', `모든 소재 비주얼 체크 완료!`);
  await updateTask(taskSeo, 'completed', `${totalCreatives}개 카피 작성`);
  await updateTask(taskVisual, 'completed', `${totalCreatives}개 비주얼 감수`);
  await updateTask(taskMotion, 'in_progress');

  // === Phase 2.5: 이미지/동영상 생성 ===
  if (options.generateImage && settings.geminiApiKey) {
    await addEvent(campaignId, 'yuna', '유나', 'creative', `AI 이미지 생성을 시작합니다! Gemini Nano Banana 2로 각 소재별 비주얼을 만들게요.`);

    if (imageRefs.length > 0) {
      await addEvent(campaignId, 'yuna', '유나', 'creative', `CEO가 제공한 참고 이미지 ${imageRefs.length}개의 스타일과 분위기를 반영합니다!`);
    }

    // 참고 이미지 설명을 프롬프트에 추가
    const refContext = imageRefs.map((m) => m.parsedContent?.description).filter(Boolean).join(', ');

    for (const row of allCreativeRows) {
      let prompt = (row.image_prompt as string) || `Marketing image for ${row.angle} angle, ${productInfo.name}`;
      if (refContext) prompt += `. Reference style: ${refContext}`;
      const result = await generateImage(settings.geminiApiKey, prompt);

      if (result) {
        const fileName = `${campaignId}/${row.id}-image.png`;
        const buffer = Buffer.from(result.imageBase64, 'base64');
        await supabase.storage.from('campaign-media').upload(fileName, buffer, { contentType: result.mimeType, upsert: true });
        const { data: publicUrl } = supabase.storage.from('campaign-media').getPublicUrl(fileName);
        await supabase.from('creatives').update({ image_url: publicUrl.publicUrl }).eq('id', row.id);
        row.image_url = publicUrl.publicUrl;
      }
    }

    await addEvent(campaignId, 'yuna', '유나', 'creative', `AI 이미지 ${allCreativeRows.length}개 생성 완료! 각 소재에 비주얼이 적용되었습니다.`);
  }

  if (options.generateVideo && settings.runwayApiKey) {
    await addEvent(campaignId, 'doha', '도하', 'creative', `AI 동영상 생성을 시작합니다! Runway Gen-4로 숏폼 영상을 만들게요.`);

    if (videoSources.length > 0) {
      await addEvent(campaignId, 'doha', '도하', 'creative', `CEO가 업로드한 동영상/이미지 소스 ${videoSources.length}개를 활용합니다!`);
    }

    const videoTargets = allCreativeRows.slice(0, 3);
    let videoCount = 0;

    for (let i = 0; i < videoTargets.length; i++) {
      const row = videoTargets[i];
      // CEO 업로드 소스가 있으면 우선 사용, 없으면 AI 생성 이미지 사용
      const sourceMedia = videoSources[i % videoSources.length];
      const inputUrl = sourceMedia?.file_url || (row.image_url as string | undefined);
      const prompt = `${productInfo.name} marketing video. ${row.angle} angle. Hook: ${row.hooking_text}. Cinematic, modern, engaging social media ad style.`;

      if (inputUrl) {
        const videoUrl = await generateVideo(settings.runwayApiKey, inputUrl, prompt);
        if (videoUrl) {
          await supabase.from('creatives').update({ video_url: videoUrl }).eq('id', row.id);
          videoCount++;
        }
      }
    }

    await addEvent(campaignId, 'doha', '도하', 'creative', `AI 숏폼 동영상 ${videoCount}개 생성 완료!${videoSources.length > 0 ? ' CEO 소스 영상을 활용했습니다.' : ' 이미지 기반 5초 영상입니다.'}`);
  } else {
    await addEvent(campaignId, 'doha', '도하', 'creative', `1위 소재 기반 숏폼 영상 컨셉 기획 중...`);
  }

  // === Phase 2.7: Figma 배너 합성 ===
  if (options.composeBanner && options.figmaFileUrl && settings.figmaApiKey && settings.geminiApiKey) {
    await addEvent(campaignId, 'yuna', '유나', 'creative', `Figma 템플릿 기반 광고 배너 합성을 시작합니다!`);

    const template = await fetchFigmaTemplate(settings.figmaApiKey, options.figmaFileUrl);

    if (template && template.frames.length > 0) {
      await addEvent(campaignId, 'yuna', '유나', 'creative', `Figma 템플릿에서 ${template.frames.length}개 플랫폼 프레임을 발견했습니다: ${template.frames.map(f => f.name).join(', ')}`);

      // 상위 3개 소재 × 각 프레임
      const bannerTargets = allCreativeRows.slice(0, 3);
      let bannerCount = 0;

      for (const row of bannerTargets) {
        for (const frame of template.frames) {
          const result = await composeBanner(settings.geminiApiKey, frame, {
            hookingText: row.hooking_text as string,
            copyText: row.copy_text as string,
            productImageUrl: (row.image_url as string) || undefined,
          });

          if (result) {
            const fileName = `${campaignId}/${row.id}-banner-${frame.name.toLowerCase()}.png`;
            const buffer = Buffer.from(result.imageBase64, 'base64');
            await supabase.storage.from('campaign-media').upload(fileName, buffer, { contentType: result.mimeType, upsert: true });
            const { data: publicUrl } = supabase.storage.from('campaign-media').getPublicUrl(fileName);

            // 첫 번째 프레임의 배너 URL을 대표로 저장
            if (frame === template.frames[0]) {
              await supabase.from('creatives').update({ banner_url: publicUrl.publicUrl }).eq('id', row.id);
            }
            bannerCount++;
          }
        }
      }

      await addEvent(campaignId, 'yuna', '유나', 'creative', `Figma 광고 배너 ${bannerCount}개 합성 완료! 플랫폼별 배너가 준비되었습니다.`);
    } else {
      await addEvent(campaignId, 'yuna', '유나', 'system', `Figma 템플릿을 읽을 수 없습니다. URL과 API 키를 확인해주세요.`);
    }
  }

  // === Phase 3: 투표 ===
  await updateCampaignStatus(campaignId, 'voting');
  await updateTask(taskData, 'in_progress');
  await addEvent(campaignId, 'eunji', '은지', 'vote', `100인 AI 심사위원단 투표 시작합니다!`);
  await addEvent(campaignId, 'minseo', '민서', 'chat', `니치 타겟이 "이건 내 이야기다"라고 느끼는 소재가 이겨야 합니다.`);

  const { data: allCreatives } = await supabase.from('creatives').select('*').eq('campaign_id', campaignId);

  for (const creative of allCreatives || []) {
    const selectedJurors = selectRepresentativeJurors(10);
    const voteRows: Array<Record<string, unknown>> = [];

    for (const juror of selectedJurors) {
      let score: number;
      let comment: string;
      try {
        const prompt = buildJuryVotePrompt(
          juror.name, juror.description, juror.age, juror.gender,
          creative.hooking_text, creative.copy_text, creative.angle, productInfo.name
        );
        const response = await callLLM(settings, prompt);
        const result = parseJSONResponse<{ score: number; comment: string }>(response.content);
        score = Math.min(10, Math.max(1, result.score));
        comment = result.comment;
      } catch {
        score = Math.floor(Math.random() * 4) + 6;
        comment = '자동 평가';
      }
      voteRows.push({ campaign_id: campaignId, creative_id: creative.id, jury_id: juror.id, score, comment });
    }

    // Simulate remaining 90
    const avgScore = voteRows.reduce((sum, v) => sum + (v.score as number), 0) / voteRows.length;
    for (let i = 0; i < 90; i++) {
      const juror = JURY_PERSONAS[(i + 10) % JURY_PERSONAS.length];
      const variance = (Math.random() - 0.5) * 3;
      const s = Math.min(10, Math.max(1, Math.round(avgScore + variance)));
      voteRows.push({ campaign_id: campaignId, creative_id: creative.id, jury_id: juror.id, score: s, comment: generateAutoComment(juror.personaGroup, s) });
    }

    await supabase.from('votes').insert(voteRows);

    const totalAvg = voteRows.reduce((sum, v) => sum + (v.score as number), 0) / voteRows.length;
    await addEvent(campaignId, 'eunji', '은지', 'vote', `"${creative.angle}" 투표 완료 - 평균 ${totalAvg.toFixed(1)}점`);
  }

  // Final results
  const { data: topCreative } = await supabase.rpc('get_top_creative', { p_campaign_id: campaignId }).maybeSingle() as { data: { angle: string; hooking_text: string; avg_score: number } | null };

  if (!topCreative) {
    const { data: creativesWithVotes } = await supabase.from('creatives').select('angle, hooking_text').eq('campaign_id', campaignId).limit(1);
    if (creativesWithVotes && creativesWithVotes.length > 0) {
      await addEvent(campaignId, 'eunji', '은지', 'vote', `투표 집계 완료! 1위: "${creativesWithVotes[0].angle}"`);
      await addEvent(campaignId, 'minseo', '민서', 'vote', `1위: "${creativesWithVotes[0].hooking_text}" - 메인 광고 소재로 추천합니다!`);
    }
  } else {
    await addEvent(campaignId, 'eunji', '은지', 'vote', `투표 집계 완료! 1위: "${topCreative.angle}" (${Number(topCreative.avg_score).toFixed(1)}점)`);
    await addEvent(campaignId, 'minseo', '민서', 'vote', `1위: "${topCreative.hooking_text}" - 메인 광고 소재로 추천합니다!`);
  }

  await updateTask(taskData, 'completed', '투표 집계 및 분석 완료');
  await updateTask(taskMotion, 'completed', '1위 소재 기반 숏폼 컨셉 완료');
  await updateTask(taskPerf, 'in_progress');

  // === 마무리 ===
  await updateCampaignStatus(campaignId, 'active');
  await addEvent(campaignId, 'taeyang', '태양', 'deploy', `1위 소재 기반 광고 세팅 완료!`);
  await addEvent(campaignId, 'doha', '도하', 'creative', `1위 소재 숏폼 버전 제작 가능합니다!`);
  await addEvent(campaignId, 'hana', '하나', 'chat', `모든 팀원 수고하셨습니다! "${productInfo.name}" 캠페인입니다.`);
  await addEvent(campaignId, 'hana', '하나', 'system', `니치밴딩 캠페인 파이프라인 완료.`);
  await updateTask(taskPerf, 'completed', '광고 세팅 완료');
  await updateTask(taskDev, 'completed', '파이프라인 정상 운영 완료');

  return NextResponse.json({ campaignId, status: 'completed' });
}

// === Helpers ===
function selectRepresentativeJurors(count: number) {
  const groups = ['trend', 'practical', 'emotional', 'analytical', 'impulsive'] as const;
  const selected = [];
  for (let i = 0; i < count; i++) {
    const group = groups[i % groups.length];
    const members = JURY_PERSONAS.filter((j) => j.personaGroup === group);
    selected.push(members[Math.floor(Math.random() * members.length)]);
  }
  return selected;
}

function generateAutoComment(personaGroup: string, score: number): string {
  const c: Record<string, Record<string, string[]>> = {
    trend: { high: ['틱톡에서 대박날 듯!', '바이럴 감 있음 ㅋㅋ', '트렌드 잘 잡았네요'], low: ['좀 올드함...', '요즘 안 먹혀요', '진지함'] },
    practical: { high: ['가성비 메시지 명확', '기능이 잘 드러남', '실용적'], low: ['뭘 파는 건지...', '혜택 불분명', '구체적이면 좋겠음'] },
    emotional: { high: ['감성 터짐 ㅠ', '무드 좋아요', '디자인 감각 최고'], low: ['감성 안 와닿아요', '색감 아쉬움', '스토리 약함'] },
    analytical: { high: ['근거 명확 좋은 카피', '타겟 정확', 'CTR 높을 듯'], low: ['수치적 근거 부족', '논리 약함', '신뢰도 떨어짐'] },
    impulsive: { high: ['당장 설치하고 싶음!', '이거 사야됨!!', '바로 결제'], low: ['별로 끌리지 않음', '급한 느낌 없음', '임팩트 부족'] },
  };
  const g = c[personaGroup] || c.practical;
  const pool = g[score >= 7 ? 'high' : 'low'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateDemoPlan(productName: string) {
  const plans = [];
  const themes = [
    { theme: '인지도 확보 & 티저', channels: ['instagram', 'tiktok'] },
    { theme: '바이럴 챌린지', channels: ['tiktok', 'youtube'] },
    { theme: '퍼포먼스 마케팅', channels: ['instagram', 'blog'] },
    { theme: '리텐션 & 성장', channels: ['youtube', 'blog'] },
  ];
  for (let day = 1; day <= 30; day++) {
    const week = Math.ceil(day / 7);
    const wt = themes[Math.min(week - 1, 3)];
    plans.push({ day, week, title: `${productName} ${wt.theme}`, description: `${wt.theme} 전략 ${day}일차`, channels: wt.channels, target: day <= 7 ? '얼리어답터' : day <= 14 ? '2차 확산층' : '대중', goal: `${Math.min(day * 350, 10000)}명` });
  }
  return plans;
}

function generateDemoCreatives() {
  return [
    { angle: '감성형', hookingText: '당신의 소중한 순간을 영원히', copyText: '매일 스쳐지나가는 평범한 순간들이 가장 소중한 기억입니다.', imagePrompt: 'Warm emotional family photo moment' },
    { angle: '유머형', hookingText: '아직도 수동으로? 🤯', copyText: 'AI가 3초면 끝나는 걸 3시간씩 하고 계세요?', imagePrompt: 'Funny character struggling with manual work' },
    { angle: '기능형', hookingText: '단 3번의 탭으로 완성', copyText: '사진 선택부터 완성까지 평균 10초.', imagePrompt: 'Clean UI showing 3-step process' },
    { angle: '스토리형', hookingText: '엄마가 울었다', copyText: '시골 엄마에게 손녀 사진첩 보내드렸더니 전화가 왔습니다.', imagePrompt: 'Grandma looking at photo album with tears of joy' },
    { angle: 'FOMO형', hookingText: '오늘까지만 무료', copyText: '프리미엄 30일 무료 체험이 오늘 자정 종료.', imagePrompt: 'Countdown timer with urgency' },
  ];
}
