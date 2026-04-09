// Telegram Bot API 클라이언트

interface TelegramButton {
  text: string;
  callback_data: string;
}

interface SendMessageOptions {
  parseMode?: 'Markdown' | 'HTML';
  buttons?: TelegramButton[][];
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  options: SendMessageOptions = {}
): Promise<boolean> {
  if (!botToken || !chatId) return false;

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode || 'Markdown',
    };

    if (options.buttons && options.buttons.length > 0) {
      body.reply_markup = {
        inline_keyboard: options.buttons,
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  text?: string
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch { /* empty */ }
}

export async function editTelegramMessage(
  botToken: string,
  chatId: string,
  messageId: number,
  text: string
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch { /* empty */ }
}
