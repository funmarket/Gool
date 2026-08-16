import { AppError } from '../../http/errors/app-error.js';

export type TimeIdCursor = {
  at: Date;
  id: string;
};

export function decodeTimeIdCursor(value: string, label: string): TimeIdCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as {
      at?: unknown;
      id?: unknown;
    };
    if (typeof parsed.id !== 'string' || !parsed.id) throw new Error('missing id');
    if (typeof parsed.at !== 'string') throw new Error('missing timestamp');
    const at = new Date(parsed.at);
    if (Number.isNaN(at.getTime())) throw new Error('invalid timestamp');
    return { at, id: parsed.id };
  } catch {
    throw new AppError(400, 'INVALID_CURSOR', `${label} cursor is invalid.`);
  }
}

export function encodeTimeIdCursor(at: Date, id: string): string {
  return Buffer.from(JSON.stringify({ at: at.toISOString(), id })).toString('base64url');
}
