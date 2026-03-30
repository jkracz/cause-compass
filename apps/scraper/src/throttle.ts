/**
 * Per-domain throttle.
 * Ensures at least `delayMs` between requests to the same domain.
 */
export class DomainThrottle {
  private lastFetch = new Map<string, number>();
  private delayMs: number;

  constructor(delayMs: number) {
    this.delayMs = delayMs;
  }

  /**
   * Wait until it's safe to fetch the given URL's domain.
   * Returns immediately if no recent request to this domain.
   */
  async wait(url: string): Promise<void> {
    let domain: string;
    try {
      domain = new URL(url).hostname;
    } catch {
      return;
    }

    const last = this.lastFetch.get(domain);
    if (last !== undefined) {
      const elapsed = Date.now() - last;
      if (elapsed < this.delayMs) {
        await sleep(this.delayMs - elapsed);
      }
    }

    this.lastFetch.set(domain, Date.now());
  }

  /** Prune entries older than 60s to prevent memory leak. */
  prune(): void {
    const cutoff = Date.now() - 60_000;
    for (const [domain, ts] of this.lastFetch) {
      if (ts < cutoff) {
        this.lastFetch.delete(domain);
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
