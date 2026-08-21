import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const N = 16_384;
const R = 8;
const P = 1;
const MAX_MEMORY = 64 * 1024 * 1024;
const VERSION = 'scrypt-v1';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    maxmem: MAX_MEMORY,
  })) as Buffer;

  return [VERSION, N, R, P, salt.toString('base64url'), derived.toString('base64url')].join('$');
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [version, nRaw, rRaw, pRaw, saltRaw, expectedRaw] = encoded.split('$');
  if (version !== VERSION || !nRaw || !rRaw || !pRaw || !saltRaw || !expectedRaw) return false;

  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (n !== N || r !== R || p !== P) return false;

  try {
    const salt = Buffer.from(saltRaw, 'base64url');
    const expected = Buffer.from(expectedRaw, 'base64url');
    if (expected.length !== KEY_LENGTH) return false;

    const actual = (await scrypt(password, salt, KEY_LENGTH, {
      N: n,
      r,
      p,
      maxmem: MAX_MEMORY,
    })) as Buffer;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
