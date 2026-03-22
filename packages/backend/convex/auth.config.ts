import type { AuthConfig } from "convex/server";

const appOrigin = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env?.APP_ORIGIN;

if (!appOrigin) {
  throw new Error("APP_ORIGIN must be set for Shoo authentication");
}

export default {
  providers: [
    {
      type: "customJwt",
      issuer: "https://shoo.dev",
      jwks: "https://shoo.dev/.well-known/jwks.json",
      algorithm: "ES256",
      applicationID: `origin:${appOrigin}`,
    },
  ],
} satisfies AuthConfig;
