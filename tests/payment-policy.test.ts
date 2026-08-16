import assert from 'node:assert/strict';
import test from 'node:test';
import { assertMethodAllowedForPurpose } from '../apps/api/src/modules/payments/domain/payment-policy.js';

for (const purpose of ['EVENT_FEE', 'RIDE_SHARE', 'FUND_CONTRIBUTION'] as const) {
  test(`${purpose} accepts cash`, () => {
    assert.doesNotThrow(() => assertMethodAllowedForPurpose(purpose, 'CASH'));
  });

  test(`${purpose} rejects Telegram Stars`, () => {
    assert.throws(
      () => assertMethodAllowedForPurpose(purpose, 'TELEGRAM_STARS'),
      (error: unknown) =>
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'PAYMENT_METHOD_NOT_ALLOWED',
    );
  });
}

test('digital products accept Telegram Stars', () => {
  assert.doesNotThrow(() => assertMethodAllowedForPurpose('DIGITAL_PRODUCT', 'TELEGRAM_STARS'));
});

test('digital products reject cash', () => {
  assert.throws(
    () => assertMethodAllowedForPurpose('DIGITAL_PRODUCT', 'CASH'),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'PAYMENT_METHOD_NOT_ALLOWED',
  );
});
