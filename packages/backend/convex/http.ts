/**
 * HTTP endpoints for Convex.
 * Handles webhooks from external services like OpenAI.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

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
      const result = await ctx.runAction(internal.openAiBatch.handleWebhook, {
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
