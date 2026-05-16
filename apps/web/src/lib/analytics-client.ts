"use client";

import type posthog from "posthog-js";

type PostHog = typeof posthog;
type CaptureProperties = Record<string, unknown>;

let posthogPromise: Promise<PostHog | null> | null = null;

async function getPostHog() {
  if (!posthogPromise) {
    posthogPromise = import("posthog-js")
      .then((mod) => {
        const client = mod.default;
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

        if (!key) {
          return null;
        }

        client.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          defaults: "2025-05-24",
          capture_exceptions: true,
        });

        return client;
      })
      .catch((error) => {
        console.error("Failed to load analytics", error);
        return null;
      });
  }

  return posthogPromise;
}

export const analytics = {
  capture(event: string, properties?: CaptureProperties) {
    void getPostHog().then((client) => {
      client?.capture(event, properties);
    });
  },

  captureException(error: unknown) {
    void getPostHog().then((client) => {
      client?.captureException(error);
    });
  },

  identify(distinctId: string, properties?: CaptureProperties) {
    void getPostHog().then((client) => {
      client?.identify(distinctId, properties);
    });
  },

  reset() {
    void getPostHog().then((client) => {
      client?.reset();
    });
  },
};
