/**
 * Shared Codex SDK helpers used by the Codex confirmation and research runners.
 */
import type { Usage } from "@openai/codex-sdk";

/**
 * Detects how the Codex SDK will authenticate. An explicit API key takes
 * precedence; otherwise the SDK falls back to the local `codex login` session.
 */
export function assertCodexCredentials(): "api-key" | "login" {
  if (process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY) {
    return "api-key";
  }
  return "login";
}

/**
 * Maps a Codex SDK `Usage` object to the persisted research-run usage shape.
 */
export function mapCodexUsage(usage: Usage | null) {
  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: usage.input_tokens,
    cachedInputTokens: usage.cached_input_tokens,
    outputTokens: usage.output_tokens,
    reasoningOutputTokens: usage.reasoning_output_tokens,
  };
}
