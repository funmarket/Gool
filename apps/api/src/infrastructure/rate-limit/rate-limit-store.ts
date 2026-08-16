export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}
type Entry = { count: number; resetAt: number };
export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly data = new Map<string, Entry>();
  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const current = this.data.get(key);
    if (!current || current.resetAt <= now) {
      const next = { count: 1, resetAt: now + windowMs };
      this.data.set(key, next);
      return next;
    }
    current.count += 1;
    return current;
  }
}
