import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeTimeIdCursor,
  encodeTimeIdCursor,
} from '../apps/api/src/infrastructure/database/cursor.js';

test('time/id cursor round-trips exactly', () => {
  const at = new Date('2026-08-15T20:00:00.000Z');
  const encoded = encodeTimeIdCursor(at, 'row_123');
  const decoded = decodeTimeIdCursor(encoded, 'Test');
  assert.equal(decoded.id, 'row_123');
  assert.equal(decoded.at.toISOString(), at.toISOString());
});

test('invalid cursor is rejected with stable code', () => {
  assert.throws(
    () => decodeTimeIdCursor('not-a-cursor', 'Test'),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'INVALID_CURSOR',
  );
});
