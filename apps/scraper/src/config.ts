function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function optionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = parseInt(raw, 10);
  return Number.isNaN(value) ? fallback : value;
}

function optionalBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const workerId = optional("WORKER_ID", `worker-${process.pid}`);

export const config = {
  convexSiteUrl: required("CONVEX_SITE_URL"),
  workerToken: required("WORKER_TOKEN"),
  workerId,
  concurrency: optionalInt("CONCURRENCY", 20),
  pollIntervalMs: optionalInt("POLL_INTERVAL_MS", 2000),
  emptyClaimThreshold: optionalInt("EMPTY_CLAIM_THRESHOLD", 10),
  idlePollIntervalMs: optionalInt("IDLE_POLL_INTERVAL_MS", 30 * 60 * 1000),
  domainThrottleMs: optionalInt("DOMAIN_THROTTLE_MS", 2000),
  healthFile: optional("WORKER_HEALTH_FILE", `/tmp/${workerId}.health.json`),
  healthUpdateMs: optionalInt("HEALTH_UPDATE_MS", 10000),
  healthMaxAgeMs: optionalInt("HEALTH_MAX_AGE_MS", 120000),
  browserHeadless: optionalBoolean("BROWSER_HEADLESS", true),
  browserNavigationTimeoutMs: optionalInt("BROWSER_NAV_TIMEOUT_MS", 45000),
  browserWaitAfterLoadMs: optionalInt("BROWSER_WAIT_AFTER_LOAD_MS", 1500),
} as const;
