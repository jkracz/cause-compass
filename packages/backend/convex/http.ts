/**
 * HTTP endpoints for Convex.
 * Handles webhooks from external services (OpenAI) and worker API routes.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Type declaration for environment variables in Convex HTTP actions
declare const process: {
  env: Record<string, string | undefined>;
};

const http = httpRouter();

// --- Worker request body types ---

type ClaimBody = {
  queueType: "html" | "browser";
  workerId: string;
};

type CompleteBody = {
  jobId: Id<"crawlQueue">;
  crawlResult: {
    textContent?: string;
    aboutLinks?: string[];
    donationLinks?: string[];
    socialMediaUrls?: string[];
    logoLinks?: string[];
    hasNewsletterSignup?: boolean;
    emailAddresses?: string[];
  };
};

type FailBody = {
  jobId: Id<"crawlQueue">;
  error: string;
};

type EnqueueBody = {
  queueType: "html" | "browser";
  orgId: Id<"organizations">;
  ein: string;
  url: string;
  fallbackReason?: "LOW_TEXT" | "JS_APP_SHELL" | "HTTP_403_OR_429" | "CLOUDFLARE_CHALLENGE" | "OTHER";
  maxAttempts?: number;
};

// --- Worker auth helper ---

function verifyWorkerToken(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice(7);
  const expectedToken = process.env.WORKER_TOKEN;
  if (!expectedToken) {
    console.error("WORKER_TOKEN env var not configured");
    return false;
  }
  return token === expectedToken;
}

// --- Worker API routes ---

/**
 * POST /worker/claim
 * Body: { queueType: "html" | "browser", workerId: string }
 */
http.route({
  path: "/worker/claim",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyWorkerToken(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
      const body = (await request.json()) as ClaimBody;
      const result = await ctx.runMutation(internal.crawlQueue.claim, {
        queueType: body.queueType,
        workerId: body.workerId,
      });
      return Response.json(result);
    } catch (error) {
      console.error("Worker claim error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

/**
 * POST /worker/complete
 * Body: { jobId: string, crawlResult: { ... crawlResults fields } }
 */
http.route({
  path: "/worker/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyWorkerToken(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
      const body = (await request.json()) as CompleteBody;

      // Insert crawl result first
      const crawlResultId = await ctx.runMutation(
        internal.crawlQueue.insertCrawlResult,
        {
          jobId: body.jobId,
          crawlResult: body.crawlResult,
        },
      );

      // Then complete the job
      await ctx.runMutation(internal.crawlQueue.complete, {
        jobId: body.jobId,
        crawlResultId,
      });

      return Response.json({ success: true, crawlResultId });
    } catch (error) {
      console.error("Worker complete error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

/**
 * POST /worker/fail
 * Body: { jobId: string, error: string }
 */
http.route({
  path: "/worker/fail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyWorkerToken(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
      const body = (await request.json()) as FailBody;
      await ctx.runMutation(internal.crawlQueue.fail, {
        jobId: body.jobId,
        error: body.error,
      });
      return Response.json({ success: true });
    } catch (error) {
      console.error("Worker fail error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

/**
 * POST /worker/enqueue
 * Body: { queueType, orgId, ein, url, fallbackReason?, maxAttempts? }
 * Used by HTML worker to escalate jobs to the browser queue.
 */
http.route({
  path: "/worker/enqueue",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!verifyWorkerToken(request)) {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
      const body = (await request.json()) as EnqueueBody;
      const jobId = await ctx.runMutation(internal.crawlQueue.enqueue, {
        queueType: body.queueType,
        orgId: body.orgId,
        ein: body.ein,
        url: body.url,
        fallbackReason: body.fallbackReason,
        maxAttempts: body.maxAttempts,
      });
      return Response.json({ jobId });
    } catch (error) {
      console.error("Worker enqueue error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

/**
 * OpenAI Webhook endpoint.
 * Receives batch.completed and batch.failed events.
 *
 * Setup:
 * 1. Go to https://platform.openai.com/settings/project/webhooks
 * 2. Create endpoint with URL: https://<your-deployment>.convex.site/openai-webhook
 * 3. Subscribe to: batch.completed, batch.failed
 * 4. Copy the signing secret to OPENAI_WEBHOOK_SECRET env var
 */
http.route({
  path: "/openai-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();

      // Process the webhook (includes signature verification)
      const result = await ctx.runAction(internal.batch.webhook.handleWebhook, {
        body,
        webhookId: request.headers.get("webhook-id") ?? "",
        webhookTimestamp: request.headers.get("webhook-timestamp") ?? "",
        webhookSignature: request.headers.get("webhook-signature") ?? "",
      });

      if (!result.success) {
        return new Response(result.error, { status: 400 });
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

export default http;
