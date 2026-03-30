/**
 * Webhook handler for OpenAI batch events.
 */

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { WorkflowId } from "@convex-dev/workflow";
import { workflow, batchCompletedEvent } from "./workflow";
import type { OpenAIWebhookEvent } from "./types";
import { getBatch } from "../../lib/openAiBatch";

// Type declaration for environment variables in Convex actions
declare const process: {
  env: Record<string, string | undefined>;
};

/**
 * Verify webhook signature using Standard Webhooks spec.
 * https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md
 */
async function verifyWebhookSignature(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string,
): Promise<boolean> {
  // Check timestamp is recent (within 5 minutes)
  const timestamp = parseInt(webhookTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error("Webhook timestamp too old or in future");
    return false;
  }

  // Build the signed payload: "webhook_id.timestamp.body"
  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;

  // The secret is base64 encoded with "whsec_" prefix
  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;

  // Decode the base64 secret
  const keyBytes = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));

  // Import the key for HMAC-SHA256
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Sign the payload
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(signedPayload),
  );

  // Convert to base64
  const expectedSignature =
    "v1," + btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // The webhook-signature header may contain multiple signatures separated by spaces
  const signatures = webhookSignature.split(" ");
  return signatures.some((sig) => sig === expectedSignature);
}

/**
 * Handle incoming OpenAI webhook.
 * Called by the HTTP endpoint when OpenAI sends batch.completed or batch.failed.
 */
export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    webhookId: v.string(),
    webhookTimestamp: v.string(),
    webhookSignature: v.string(),
  },
  handler: async (
    ctx,
    { body, webhookId, webhookTimestamp, webhookSignature },
  ): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const webhookSecret = process.env.OPENAI_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("OPENAI_WEBHOOK_SECRET not configured");
      return { success: false, error: "Webhook secret not configured" };
    }

    // Verify signature
    const isValid = await verifyWebhookSignature(
      body,
      webhookId,
      webhookTimestamp,
      webhookSignature,
      webhookSecret,
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return { success: false, error: "Invalid signature" };
    }

    // Parse the event
    let event: OpenAIWebhookEvent;
    try {
      event = JSON.parse(body) as OpenAIWebhookEvent;
    } catch {
      console.error("Failed to parse webhook body");
      return { success: false, error: "Invalid JSON" };
    }

    console.log(`Received webhook: ${event.type} for batch ${event.data.id}`);

    // Find the batch job by OpenAI's batch ID
    const job = await ctx.runQuery(internal.batchJobs.internalGetByBatchId, {
      batchId: event.data.id,
    });

    if (!job) {
      console.warn(`No batch job found for batchId: ${event.data.id}`);
      // Return success anyway - might be a batch we don't track
      return { success: true };
    }

    if (!job.workflowId) {
      console.warn(`Batch job ${job.jobId} has no workflowId`);
      return { success: true };
    }

    if (event.type === "batch.completed") {
      const batch = await getBatch(event.data.id);
      const outputFileId = event.data.output_file_id ?? batch.output_file_id;
      if (!outputFileId) {
        console.error("batch.completed event missing output_file_id");
        return { success: false, error: "Missing output_file_id" };
      }

      // Update job with output file ID
      await ctx.runMutation(internal.batchJobs.internalSetOutputFileId, {
        jobId: job.jobId,
        outputFileId,
      });

      // Send event to unblock the waiting workflow
      await workflow.sendEvent(ctx, {
        ...batchCompletedEvent,
        workflowId: job.workflowId as WorkflowId,
        value: { outputFileId },
      });

      console.log(
        `Notified workflow ${job.workflowId} that batch ${job.jobId} completed`,
      );
    } else if (event.type === "batch.failed") {
      const batch = await getBatch(event.data.id);
      // Mark job as failed
      const errorMsg =
        event.data.errors?.data?.[0]?.message ??
        batch.errors?.data?.[0]?.message ??
        "Batch failed (no error message)";

      await ctx.runMutation(internal.batchJobs.internalMarkFailed, {
        jobId: job.jobId,
        error: errorMsg,
      });

      // Cancel the workflow
      await workflow.cancel(ctx, job.workflowId as WorkflowId);
      console.log(
        `Canceled workflow ${job.workflowId} due to batch failure: ${errorMsg}`,
      );
    }

    return { success: true };
  },
});
