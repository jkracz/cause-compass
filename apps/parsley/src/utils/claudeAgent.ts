/**
 * Shared Claude Agent SDK helpers used by the Claude confirmation and research
 * runners.
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { extractJsonPayload } from "./textUtils";

/**
 * Detects how the Claude Agent SDK will authenticate. An `ANTHROPIC_API_KEY`
 * takes precedence (metered billing); otherwise the runner uses the local
 * `claude login` subscription session. On macOS the credential material may live
 * in the Keychain rather than `~/.claude/.credentials.json`, so we only confirm
 * the Claude config directory exists — the SDK surfaces a clear error on the
 * first call if the session is missing or stale.
 */
export function assertClaudeCredentials(): "api-key" | "subscription" {
  if (process.env.ANTHROPIC_API_KEY) {
    return "api-key";
  }
  if (existsSync(join(homedir(), ".claude"))) {
    return "subscription";
  }
  throw new Error(
    "No Claude credentials found. Either set ANTHROPIC_API_KEY for metered API billing, or install and log in to Claude Code (`claude login`) to use your Max subscription.",
  );
}

type ClaudeUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
};

/**
 * Maps a Claude Agent SDK result `usage` object to the persisted research-run
 * usage shape.
 */
export function mapClaudeUsage(usage: ClaudeUsage | null | undefined) {
  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: usage.input_tokens,
    cachedInputTokens: usage.cache_read_input_tokens,
    outputTokens: usage.output_tokens,
  };
}

/**
 * Why a Claude result could not be turned into usable structured output.
 * - `schema_invalid`: the model produced output that could not be parsed.
 * - `incomplete`: the run ended without a usable success payload (e.g. hit the
 *   max-turns limit or an unexpected result subtype).
 * - `no_result`: the SDK iterator finished without emitting a result message.
 */
export type ClaudeResultErrorCode = "schema_invalid" | "incomplete" | "no_result";

export class ClaudeResultError extends Error {
  readonly code: ClaudeResultErrorCode;

  constructor(
    code: ClaudeResultErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ClaudeResultError";
    this.code = code;
  }
}

export type ClaudeResult = {
  output: unknown;
  usage: ReturnType<typeof mapClaudeUsage>;
  sessionId: string | undefined;
  subtype: string;
};

/**
 * Drains the Agent SDK async iterator until the terminal `result` message and
 * returns the structured payload alongside usage and the session id. Prefers
 * SDK-validated `structured_output` (API-key auth); falls back to parsing
 * free-form `result.result` text (subscription auth, where `outputFormat` is
 * ignored). Throws {@link ClaudeResultError} when no usable output is produced;
 * callers map the `code` onto their own status taxonomy. Timeouts are handled by
 * the caller (via `withTimeout` or an `AbortController`), not here.
 */
export async function collectClaudeResult(
  iterator: AsyncIterable<unknown>,
): Promise<ClaudeResult> {
  for await (const message of iterator) {
    if (
      !message ||
      typeof message !== "object" ||
      (message as { type?: string }).type !== "result"
    ) {
      continue;
    }
    const result = message as {
      subtype?: string;
      structured_output?: unknown;
      result?: unknown;
      usage?: ClaudeUsage;
      session_id?: string;
    };
    const usage = mapClaudeUsage(result.usage);
    const sessionId = result.session_id;
    const subtype = result.subtype ?? "<missing>";

    if (result.subtype === "success") {
      if (result.structured_output !== undefined) {
        return { output: result.structured_output, usage, sessionId, subtype };
      }
      if (typeof result.result === "string") {
        try {
          return {
            output: JSON.parse(extractJsonPayload(result.result)),
            usage,
            sessionId,
            subtype,
          };
        } catch (error) {
          throw new ClaudeResultError(
            "schema_invalid",
            `Malformed structured output: ${
              error instanceof Error ? error.message : String(error)
            }`,
            { cause: error },
          );
        }
      }
      throw new ClaudeResultError(
        "incomplete",
        "Claude Agent SDK returned success result with neither structured_output nor a string result",
      );
    }
    if (result.subtype === "error_max_structured_output_retries") {
      throw new ClaudeResultError(
        "schema_invalid",
        "Claude Agent SDK exhausted structured-output retries before producing a schema-valid response",
      );
    }
    if (result.subtype === "error_max_turns") {
      throw new ClaudeResultError(
        "incomplete",
        "Claude Agent SDK hit the max-turns limit before returning a result",
      );
    }
    throw new ClaudeResultError(
      "incomplete",
      `Claude Agent SDK returned unexpected result subtype: ${subtype}`,
    );
  }
  throw new ClaudeResultError(
    "no_result",
    "Claude Agent SDK iterator completed without a result message",
  );
}
