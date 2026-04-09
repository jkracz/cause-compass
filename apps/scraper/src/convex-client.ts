import { config } from "./config.js";

export type QueueType = "html" | "browser";

export type FallbackReason =
  | "LOW_TEXT"
  | "JS_APP_SHELL"
  | "HTTP_403_OR_429"
  | "CLOUDFLARE_CHALLENGE"
  | "OTHER";

export type ClaimedJob = {
  jobId: string;
  orgId: string;
  ein: string;
  url: string;
  attemptCount: number;
  queueType: QueueType;
  fallbackReason?: FallbackReason;
};

export type CrawlResult = {
  textContent?: string;
  aboutLinks?: string[];
  donationLinks?: string[];
  socialMediaUrls?: string[];
  logoLinks?: string[];
  hasNewsletterSignup?: boolean;
  emailAddresses?: string[];
};

async function workerFetch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const url = `${config.convexSiteUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.workerToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

export async function claimJob(
  queueType: QueueType,
): Promise<ClaimedJob | null> {
  return workerFetch<ClaimedJob | null>("/worker/claim", {
    queueType,
    workerId: config.workerId,
  });
}

export async function completeJob(
  jobId: string,
  crawlResult?: CrawlResult,
): Promise<void> {
  await workerFetch("/worker/complete", {
    jobId,
    ...(crawlResult ? { crawlResult } : {}),
  });
}

export async function failJob(jobId: string, error: string): Promise<void> {
  await workerFetch("/worker/fail", { jobId, error });
}

export async function enqueueJob(params: {
  queueType: QueueType;
  orgId: string;
  ein: string;
  url: string;
  fallbackReason?: FallbackReason;
  maxAttempts?: number;
}): Promise<void> {
  await workerFetch("/worker/enqueue", params);
}
