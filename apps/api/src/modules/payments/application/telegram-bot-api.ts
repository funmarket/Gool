export interface TelegramBotApi {
  setChatMenuButton(webAppUrl: string): Promise<void>;
  createStarsInvoiceLink(input: {
    title: string;
    description: string;
    payload: string;
    stars: number;
  }): Promise<string>;
  answerPreCheckoutQuery(id: string, ok: boolean, errorMessage?: string): Promise<void>;
  refundStarPayment(telegramUserId: string, telegramPaymentChargeId: string): Promise<void>;
}
