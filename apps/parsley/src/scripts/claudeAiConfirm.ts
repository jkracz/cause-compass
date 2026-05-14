import "dotenv/config";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { ConvexHttpClient } from "convex/browser";
import { toJSONSchema } from "zod";
import {
  WebsiteConfirmationSchema,
  buildWebsiteConfirmationMessages,
  type WebsiteConfirmation,
} from "@cause/lib";
import {
  commitResultRef,
  listCandidatesRef,
  markUnverifiableRef,
  type LocalAiCandidate,
  type LocalAiCandidatePage,
} from "@/utils/aiConfirmation";
import { logger } from "@/utils/logger";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_LIMIT = 1000;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_CONCURRENCY = 5;
const MIN_PAGE_SIZE = 25;

/**
 * Applies a soft per-request timeout around the Claude Agent SDK call while
 * allowing the batch runner to continue processing later organizations.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(`Claude Agent SDK request timed out after ${timeoutMs}ms`),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function parseArgs() {
  const cliArgs = hideBin(process.argv);
  const normalizedArgs = cliArgs[0] === "--" ? cliArgs.slice(1) : cliArgs;

  return await yargs(normalizedArgs)
    .option("limit", {
      type: "number",
      default: DEFAULT_LIMIT,
      describe: "Maximum number of crawled organizations to process",
    })
    .option("model", {
      type: "string",
      default: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      describe: "Claude model name",
    })
    .option("timeout-ms", {
      type: "number",
      default: Number(process.env.ANTHROPIC_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
      describe: "Per-request Claude Agent SDK timeout",
    })
    .option("concurrency", {
      type: "number",
      default: Number(process.env.ANTHROPIC_CONCURRENCY ?? DEFAULT_CONCURRENCY),
      describe: "Number of candidates to process in parallel",
    })
    .strict()
    .parse();
}

/**
 * Runs `worker` over `items` with at most `concurrency` in flight at a time.
 * Each worker pulls from a shared index, so the pool stays full until the
 * queue drains — better throughput than chunked Promise.all when individual
 * tasks vary in duration.
 */
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const drain = async (): Promise<void> => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) {
        return;
      }
      await worker(items[idx]!);
    }
  };
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, drain));
}

/**
 * The SDK enforces `outputFormat` only on direct-API auth; the Max subscription
 * path silently ignores it and returns free-form text in `result.result`.
 * Strip a markdown fence if present, then fall back to the substring between
 * the first `{` and last `}` to tolerate stray prose.
 */
function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

/**
 * Drains the Agent SDK async iterator until the terminal `result` message.
 * Prefers SDK-validated `structured_output` (API-key auth); falls back to
 * parsing free-form `result.result` text (subscription auth).
 */
async function collectStructuredOutput(
  iterator: AsyncIterable<unknown>,
): Promise<unknown> {
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
    };
    if (result.subtype === "success") {
      if (result.structured_output !== undefined) {
        return result.structured_output;
      }
      if (typeof result.result === "string") {
        try {
          return JSON.parse(extractJsonPayload(result.result));
        } catch (error) {
          throw new Error(
            `Failed to parse JSON from Claude text response: ${
              error instanceof Error ? error.message : String(error)
            }`,
            { cause: error },
          );
        }
      }
      throw new Error(
        "Claude Agent SDK returned success result with neither structured_output nor a string result",
      );
    }
    if (result.subtype === "error_max_structured_output_retries") {
      throw new Error(
        "Claude Agent SDK exhausted structured-output retries before producing a schema-valid response",
      );
    }
    throw new Error(
      `Claude Agent SDK returned unexpected result subtype: ${result.subtype ?? "<missing>"}`,
    );
  }
  throw new Error("Claude Agent SDK iterator completed without a result message");
}

/**
 * Runs one organization through the Claude Agent SDK using the SDK's native
 * `outputFormat: json_schema` mode. The SDK handles constrained generation
 * and schema-mismatch retries; we still re-validate with Zod for type safety.
 */
async function confirmCandidate(args: {
  candidate: LocalAiCandidate;
  model: string;
  timeoutMs: number;
}): Promise<WebsiteConfirmation> {
  const outputSchema = toJSONSchema(WebsiteConfirmationSchema);
  const messages = buildWebsiteConfirmationMessages({
    ein: args.candidate.ein,
    name: args.candidate.name,
    street: args.candidate.street,
    city: args.candidate.city,
    state: args.candidate.state,
    codeDescription: args.candidate.nteeCode ?? "",
    websiteData: args.candidate.crawlData,
  });
  const systemPrompt = messages[0]!.content;
  // The schema instruction in the user prompt is required for the subscription
  // auth path (where `outputFormat` is silently ignored); on API-key auth it
  // is redundant but harmless because `outputFormat` enforces the schema.
  const userPrompt =
    messages[1]!.content +
    `\n\nReturn only JSON matching this JSON schema. Do not wrap the JSON in Markdown or add explanatory text.\n${JSON.stringify(outputSchema)}`;

  const response = query({
    prompt: userPrompt,
    options: {
      model: args.model,
      systemPrompt,
      allowedTools: [],
      permissionMode: "bypassPermissions",
      settingSources: [],
      maxTurns: 1,
      outputFormat: { type: "json_schema", schema: outputSchema },
    },
  });

  const structuredOutput = await withTimeout(
    collectStructuredOutput(response),
    args.timeoutMs,
  );

  const parsed = WebsiteConfirmationSchema.safeParse(structuredOutput);
  if (!parsed.success) {
    throw new Error(`Schema validation failed: ${parsed.error.message}`);
  }

  return parsed.data;
}

function assertClaudeCredentials(): "api-key" | "subscription" {
  if (process.env.ANTHROPIC_API_KEY) {
    return "api-key";
  }
  // On macOS, `claude login` stores credentials in the Keychain rather than
  // ~/.claude/.credentials.json, so we can only check that Claude Code itself
  // has been set up. The SDK will surface a clear error on the first call if
  // the Keychain entry is missing or stale.
  if (existsSync(join(homedir(), ".claude"))) {
    return "subscription";
  }
  throw new Error(
    "No Claude credentials found. Either set ANTHROPIC_API_KEY for metered API billing, or install and log in to Claude Code (`claude login`) to use your Max subscription.",
  );
}

async function main() {
  const argv = await parseArgs();
  const limit = Math.max(0, Math.floor(argv.limit));
  const model = argv.model;
  const timeoutMs = Math.max(1, Math.floor(argv.timeoutMs));
  const concurrency = Math.max(1, Math.floor(argv.concurrency));
  const pageSize = Math.max(MIN_PAGE_SIZE, concurrency * 2);
  const convexUrl = process.env.CONVEX_URL;
  const operatorToken = process.env.LOCAL_AI_OPERATOR_TOKEN;

  if (!convexUrl) {
    throw new Error("Missing CONVEX_URL environment variable");
  }
  if (!operatorToken) {
    throw new Error("Missing LOCAL_AI_OPERATOR_TOKEN environment variable");
  }

  const authMode = assertClaudeCredentials();

  const convex = new ConvexHttpClient(convexUrl);
  const counters = {
    attempted: 0,
    committed: 0,
    failed: 0,
    ready: 0,
    aiConfirmed: 0,
    unverifiable: 0,
  };
  let cursor: string | null = null;
  let isDone = false;

  logger.info(
    `Starting Claude AI confirmation: limit=${limit}, model=${model}, auth=${authMode}, concurrency=${concurrency}, timeoutMs=${timeoutMs}`,
  );

  const processCandidate = async (
    candidate: LocalAiCandidate,
  ): Promise<void> => {
    if (candidate.crawlData.length === 0) {
      try {
        await convex.mutation(markUnverifiableRef, {
          operatorToken,
          orgId: candidate._id,
        });
        counters.unverifiable++;
        logger.warn(
          `Marked EIN ${candidate.ein} unverifiable: no prompt-ready crawl data`,
        );
      } catch (error) {
        counters.failed++;
        logger.error(
          `Failed to mark EIN ${candidate.ein} unverifiable: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return;
    }

    try {
      const result = await confirmCandidate({ candidate, model, timeoutMs });
      const commit = await convex.mutation(commitResultRef, {
        operatorToken,
        orgId: candidate._id,
        model,
        result,
        // Trust Claude as a frontier model: skip the OpenAI re-review loop and
        // mark non-confirmed-website results as ai_confirmed instead of
        // local_ai_reviewed.
        fallbackStage: "ai_confirmed",
      });
      counters.committed++;
      if (commit.enrichmentStage === "ready") {
        counters.ready++;
      } else {
        counters.aiConfirmed++;
      }
      logger.info(
        `Committed EIN ${candidate.ein}: stage=${commit.enrichmentStage}, model=${model}`,
      );
    } catch (error) {
      counters.failed++;
      logger.error(
        `Failed EIN ${candidate.ein}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  while (counters.attempted < limit && !isDone) {
    const remaining = limit - counters.attempted;
    const page = (await convex.query(listCandidatesRef, {
      operatorToken,
      paginationOpts: {
        numItems: Math.min(pageSize, remaining),
        cursor,
      },
    })) as LocalAiCandidatePage;
    isDone = page.isDone;
    cursor = page.continueCursor;

    const batch = page.page.slice(0, remaining);
    counters.attempted += batch.length;
    await runWithConcurrency(batch, concurrency, processCandidate);
  }

  logger.info(
    `Claude AI confirmation complete: attempted=${counters.attempted}, committed=${counters.committed}, ready=${counters.ready}, ai_confirmed=${counters.aiConfirmed}, unverifiable=${counters.unverifiable}, failed=${counters.failed}`,
  );
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
