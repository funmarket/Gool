import process from 'node:process';

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const explicitUrl = process.env.TELEGRAM_WEBHOOK_URL;
const apiBaseUrl = process.env.API_BASE_URL;

if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
if (!secret || secret.length < 8)
  throw new Error('TELEGRAM_WEBHOOK_SECRET must be at least 8 characters');

const webhookUrl =
  explicitUrl ?? (apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}/webhooks/telegram` : undefined);
if (!webhookUrl) {
  throw new Error('Set TELEGRAM_WEBHOOK_URL or API_BASE_URL before registering the webhook');
}

const parsed = new URL(webhookUrl);
if (parsed.protocol !== 'https:') throw new Error('Telegram webhook URL must use HTTPS');

const endpoint = `https://api.telegram.org/bot${token}/setWebhook`;
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ['pre_checkout_query', 'message'],
  }),
});

const body = await response.json();
if (!response.ok || !body.ok) {
  throw new Error(
    `Telegram rejected webhook registration: ${body.description ?? response.statusText}`,
  );
}

console.log(`Telegram webhook registered for ${parsed.origin}${parsed.pathname}`);
