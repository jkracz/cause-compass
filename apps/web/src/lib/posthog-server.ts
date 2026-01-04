import "server-only";
import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function flushPostHog() {
  if (posthogClient) {
    posthogClient.flush();
    // Give a small delay to allow the flush to complete
    // Since flush() is synchronous but network requests are async,
    // we wait a bit to ensure events are sent
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
