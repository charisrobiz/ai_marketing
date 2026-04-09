// 캠페인 단계별 텔레그램 알림 헬퍼

import { supabase } from '@/lib/db/supabase';
import { sendTelegramMessage } from './client';

async function getTelegramConfig(): Promise<{ botToken: string; chatId: string } | null> {
  const { data: rows } = await supabase.from('settings').select('key, value');
  let botToken = '';
  let chatId = '';
  for (const r of rows || []) {
    if (r.key === 'telegramBotToken') botToken = r.value;
    if (r.key === 'telegramChatId') chatId = r.value;
  }
  if (!botToken || !chatId) return null;
  return { botToken, chatId };
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://ai-marketing-topaz-five.vercel.app';
}

// 1. 캠페인 생성 → 엔진 시작 승인 요청
export async function notifyCampaignCreated(campaignId: string, productName: string, campaignType: string) {
  const config = await getTelegramConfig();
  if (!config) return;

  const text = `🚀 *새 캠페인이 생성되었습니다*

📦 제품: *${productName}*
📋 유형: ${campaignType}
🆔 ID: \`${campaignId.slice(0, 8)}\`

AI 엔진을 시작할까요?
시작하면 마케팅 플랜, 소재, 이미지/동영상 생성, 100인 투표가 자동으로 진행됩니다.`;

  await sendTelegramMessage(config.botToken, config.chatId, text, {
    buttons: [[
      { text: '✅ 엔진 시작', callback_data: `engine_start:${campaignId}` },
      { text: '🔗 상세 보기', callback_data: `view:${campaignId}` },
    ]],
  });
}

// 2. 엔진 완료 → 본부장 검토 승인 요청
export async function notifyEngineCompleted(campaignId: string, productName: string, creativeCount: number) {
  const config = await getTelegramConfig();
  if (!config) return;

  const text = `✨ *AI 엔진 실행 완료*

📦 제품: *${productName}*
🎨 생성된 소재: ${creativeCount}개
🗳️ 100인 심사위원단 투표 완료

본부장 하나가 소재를 검토하도록 시작할까요?`;

  await sendTelegramMessage(config.botToken, config.chatId, text, {
    buttons: [[
      { text: '✅ 본부장 검토 시작', callback_data: `review_start:${campaignId}` },
      { text: '🔗 상세 보기', callback_data: `view:${campaignId}` },
    ]],
  });
}

// 3. 본부장 검토 완료 → CEO 승인 요청
export async function notifyReviewCompleted(
  campaignId: string,
  productName: string,
  approved: number,
  revision: number,
  rejected: number
) {
  const config = await getTelegramConfig();
  if (!config) return;

  const text = `👩‍💼 *본부장 검토 완료*

📦 제품: *${productName}*

📊 검토 결과:
✅ 승인: ${approved}개
📝 수정 요청: ${revision}개
❌ 반려: ${rejected}개

CEO 최종 승인이 필요합니다.`;

  await sendTelegramMessage(config.botToken, config.chatId, text, {
    buttons: [
      [{ text: '👑 전체 승인', callback_data: `ceo_approve_all:${campaignId}` }],
      [{ text: '🔗 개별 승인하기', callback_data: `view_approval:${campaignId}` }],
    ],
  });
}

// 4. CEO 승인 완료 → Week 1 시작 안내
export async function notifyCEOApproved(campaignId: string, productName: string) {
  const config = await getTelegramConfig();
  if (!config) return;

  const text = `👑 *CEO 승인 완료*

📦 제품: *${productName}*

캠페인이 활성화되었습니다.
Week 1을 시작하시겠어요?`;

  await sendTelegramMessage(config.botToken, config.chatId, text, {
    buttons: [[
      { text: '▶️ Week 1 시작', callback_data: `week_start:${campaignId}:1` },
    ]],
  });
}

// 5. 주간 리뷰 시간 알림
export async function notifyWeekReviewTime(campaignId: string, productName: string, currentWeek: number) {
  const config = await getTelegramConfig();
  if (!config) return;

  const text = `📊 *Week ${currentWeek} 리뷰 시간*

📦 제품: *${productName}*

이번 주 성과를 분석하고 다음 주 전략을 결정합니다.
- 외부 광고 API에서 실제 지표 수집
- 은지 데이터 분석
- 팀원 4명 의견 수렴
- 본부장 종합 결정

리뷰 미팅을 시작할까요?`;

  await sendTelegramMessage(config.botToken, config.chatId, text, {
    buttons: [[
      { text: `📊 Week ${currentWeek} 리뷰 시작`, callback_data: `week_review:${campaignId}:${currentWeek}` },
    ]],
  });
}

// 6. 주간 리뷰 완료 → 다음 주 진행 안내
export async function notifyWeekCompleted(
  campaignId: string,
  productName: string,
  completedWeek: number,
  nextWeek: number | null,
  decision?: string
) {
  const config = await getTelegramConfig();
  if (!config) return;

  if (nextWeek) {
    const text = `✅ *Week ${completedWeek} 리뷰 완료*

📦 제품: *${productName}*

${decision ? `🎯 본부장 결정:\n${decision}\n\n` : ''}Week ${nextWeek}을(를) 시작할까요?`;

    await sendTelegramMessage(config.botToken, config.chatId, text, {
      buttons: [[
        { text: `▶️ Week ${nextWeek} 시작`, callback_data: `week_start:${campaignId}:${nextWeek}` },
      ]],
    });
  } else {
    const text = `🎉 *캠페인 완료!*

📦 제품: *${productName}*

4주 캠페인이 모두 완료되었습니다.
대시보드에서 최종 성과를 확인하세요.

${getBaseUrl()}/campaign/${campaignId}/report`;

    await sendTelegramMessage(config.botToken, config.chatId, text);
  }
}

// 일반 알림
export async function notifyError(campaignId: string, productName: string, error: string) {
  const config = await getTelegramConfig();
  if (!config) return;

  const text = `❌ *오류 발생*

📦 제품: *${productName}*
🆔 캠페인: \`${campaignId.slice(0, 8)}\`

오류: ${error}

관리자 페이지에서 확인해주세요.`;

  await sendTelegramMessage(config.botToken, config.chatId, text);
}
