import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { answerCallbackQuery, sendTelegramMessage } from '@/lib/telegram/client';

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

// POST: Telegram callback 처리
export async function POST(request: Request) {
  const config = await getTelegramConfig();
  if (!config) return NextResponse.json({ ok: false, error: 'Telegram not configured' });

  const update = await request.json();
  const callbackQuery = update.callback_query;

  if (!callbackQuery) return NextResponse.json({ ok: true });

  const { id: callbackId, data, message } = callbackQuery;
  const chatId = String(message?.chat?.id || '');

  // 보안: 등록된 chat ID에서만 처리
  if (chatId !== config.chatId) {
    await answerCallbackQuery(config.botToken, callbackId, '권한 없음');
    return NextResponse.json({ ok: false });
  }

  const [action, campaignId, ...args] = (data || '').split(':');
  const baseUrl = getBaseUrl();

  try {
    switch (action) {
      case 'engine_start': {
        await answerCallbackQuery(config.botToken, callbackId, '엔진을 시작합니다...');
        // fire-and-forget으로 엔진 호출
        fetch(`${baseUrl}/api/engine/${campaignId}`, { method: 'POST' }).catch(() => {});
        await sendTelegramMessage(config.botToken, config.chatId,
          `⚙️ *AI 엔진 실행 시작*\n\n진행 상황은 아래에서 확인하세요:\n${baseUrl}/campaign/${campaignId}`);
        break;
      }

      case 'review_start': {
        await answerCallbackQuery(config.botToken, callbackId, '본부장 검토를 시작합니다...');
        fetch(`${baseUrl}/api/campaigns/${campaignId}/review`, { method: 'POST' }).catch(() => {});
        await sendTelegramMessage(config.botToken, config.chatId,
          `👩‍💼 *본부장 검토 시작*\n\n결과가 나오면 다시 알려드릴게요.`);
        break;
      }

      case 'ceo_approve_all': {
        await answerCallbackQuery(config.botToken, callbackId, 'CEO 일괄 승인 처리 중...');
        const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}/ceo-approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve_all', comment: '텔레그램 일괄 승인' }),
        });
        if (res.ok) {
          await sendTelegramMessage(config.botToken, config.chatId,
            `👑 *CEO 일괄 승인 완료*\n\n캠페인이 활성화되었습니다.`);
        }
        break;
      }

      case 'week_start':
      case 'week_review': {
        const week = parseInt(args[0] || '1');
        await answerCallbackQuery(config.botToken, callbackId, `Week ${week} 리뷰를 시작합니다...`);
        fetch(`${baseUrl}/api/campaigns/${campaignId}/week-review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentWeek: week }),
        }).catch(() => {});
        await sendTelegramMessage(config.botToken, config.chatId,
          `📊 *Week ${week} 리뷰 미팅 시작*\n\n실제 지표 수집 → AI 분석 → 본부장 결정 진행 중...`);
        break;
      }

      case 'view':
      case 'view_approval': {
        await answerCallbackQuery(config.botToken, callbackId);
        const url = action === 'view_approval'
          ? `${baseUrl}/campaign/${campaignId}/approval`
          : `${baseUrl}/campaign/${campaignId}`;
        await sendTelegramMessage(config.botToken, config.chatId, `🔗 ${url}`);
        break;
      }

      default:
        await answerCallbackQuery(config.botToken, callbackId, '알 수 없는 액션');
    }
  } catch (err) {
    await answerCallbackQuery(config.botToken, callbackId, '오류 발생');
    await sendTelegramMessage(config.botToken, config.chatId,
      `❌ 오류: ${err instanceof Error ? err.message : '알 수 없음'}`);
  }

  return NextResponse.json({ ok: true });
}

// GET: 웹훅 등록 (관리자가 한 번 호출하면 텔레그램 봇이 우리 서버로 callback 보내도록 등록)
export async function GET() {
  const config = await getTelegramConfig();
  if (!config) return NextResponse.json({ error: 'Telegram not configured' }, { status: 400 });

  const webhookUrl = `${getBaseUrl()}/api/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${config.botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });

  const data = await res.json();
  return NextResponse.json({ webhookUrl, telegramResponse: data });
}
