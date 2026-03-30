import { load } from "cheerio";
import type { FallbackReason } from "./convex-client.js";

export type FallbackCheck = {
  shouldFallback: boolean;
  reason?: FallbackReason;
};

/**
 * Check HTTP response for signals that require browser-based crawling.
 * Called BEFORE full extraction — uses status, headers, and raw HTML.
 */
export function checkFallback(
  status: number,
  headers: Headers,
  html: string,
): FallbackCheck {
  // 1. HTTP 403 or 429
  if (status === 403 || status === 429) {
    return { shouldFallback: true, reason: "HTTP_403_OR_429" };
  }

  const $ = load(html);

  // 2. Cloudflare challenge detection
  const hasCfRay = !!headers.get("cf-ray");
  const bodyHtml = $("body").html() ?? "";
  const hasChallengeScript = bodyHtml.includes("/cdn-cgi/challenge-platform");
  const title = $("title").text().trim();
  const hasJustAMoment = title.includes("Just a moment");

  if (hasCfRay && (hasChallengeScript || hasJustAMoment)) {
    return { shouldFallback: true, reason: "CLOUDFLARE_CHALLENGE" };
  }

  // Strip scripts/styles for text analysis
  $("script, style, noscript, svg, iframe").remove();
  const visibleText = ($("body").text() ?? "").replace(/\s+/g, " ").trim();

  // 3. JS app shell: SPA markers + high script density + low text
  const fullHtml = html;
  const spaMarkers = ["#root", "#app", "#__next", "#__nuxt"].some((m) =>
    fullHtml.includes(`id="${m.slice(1)}"`),
  );
  const scriptCount = (fullHtml.match(/<script[\s>]/gi) ?? []).length;
  const isHighScriptDensity = scriptCount > 5;

  if (spaMarkers && isHighScriptDensity && visibleText.length < 1500) {
    return { shouldFallback: true, reason: "JS_APP_SHELL" };
  }

  // 4. Low text content (after stripping)
  if (visibleText.length < 1500) {
    return { shouldFallback: true, reason: "LOW_TEXT" };
  }

  return { shouldFallback: false };
}
