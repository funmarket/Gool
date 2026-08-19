import { env } from '../../config/env.js';
import type { TelegramBotApi } from '../../modules/payments/application/telegram-bot-api.js';

export class TelegramBotApiError extends Error {
  constructor(
    readonly method: string,
    readonly description: string,
  ) {
    super(`Telegram Bot API ${method} failed: ${description}`);
    this.name = 'TelegramBotApiError';
  }
}

export class HttpTelegramBotApi implements TelegramBotApi {
  private readonly base = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

  private async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.base}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      result?: T;
      description?: string;
    };

    if (!response.ok || !payload.ok || payload.result === undefined) {
      throw new TelegramBotApiError(method, payload.description || 'Unknown Telegram error');
    }
    return payload.result;
  }

  async setChatMenuButton(webAppUrl: string) {
    await this.call<boolean>('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Open HOOMA',
        web_app: { url: webAppUrl },
      },
    });
  }

  createStarsInvoiceLink(input: {
    title: string;
    description: string;
    payload: string;
    stars: number;
  }) {
    return this.call<string>('createInvoiceLink', {
      title: input.title,
      description: input.description,
      payload: input.payload,
      currency: 'XTR',
      prices: [{ label: input.title, amount: input.stars }],
    });
  }

  async answerPreCheckoutQuery(id: string, ok: boolean, errorMessage?: string) {
    await this.call<boolean>('answerPreCheckoutQuery', {
      pre_checkout_query_id: id,
      ok,
      ...(errorMessage ? { error_message: errorMessage } : {}),
    });
  }

  async refundStarPayment(telegramUserId: string, telegramPaymentChargeId: string) {
    try {
      await this.call<boolean>('refundStarPayment', {
        user_id: telegramUserId,
        telegram_payment_charge_id: telegramPaymentChargeId,
      });
    } catch (error) {
      if (
        error instanceof TelegramBotApiError &&
        error.description.toUpperCase().includes('CHARGE_ALREADY_REFUNDED')
      ) {
        return;
      }
      throw error;
    }
  }
}
