import { PaymentDomainError } from './payment-domain-error.js';

export function assertMethodAllowedForPurpose(
  purpose: 'EVENT_FEE' | 'RIDE_SHARE' | 'FUND_CONTRIBUTION' | 'DIGITAL_PRODUCT',
  method: 'CASH' | 'TELEGRAM_STARS',
) {
  if (purpose === 'DIGITAL_PRODUCT' && method !== 'TELEGRAM_STARS') {
    throw new PaymentDomainError(
      'PAYMENT_METHOD_NOT_ALLOWED',
      'Digital HOOMA products must use Telegram Stars.',
    );
  }
  if (purpose !== 'DIGITAL_PRODUCT' && method !== 'CASH') {
    throw new PaymentDomainError(
      'PAYMENT_METHOD_NOT_ALLOWED',
      'Real-world HOOMA obligations currently accept cash only.',
    );
  }
}
