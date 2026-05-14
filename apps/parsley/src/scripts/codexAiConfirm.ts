import "dotenv/config";
import type { Codex as CodexClient } from "@openai/codex-sdk";
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

const DEFAULT_MODEL = "gpt-5.4-mini";
const DEFAULT_LIMIT = 1000;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_CONCURRENCY = 5;
const MIN_PAGE_SIZE = 25;

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
      default: process.env.CODEX_MODEL ?? DEFAULT_MODEL,
      describe: "Codex model name",
    })
    .option("timeout-ms", {
      type: "number",
      default: Number(process.env.CODEX_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
      describe: "Per-request Codex SDK timeout",
    })
    .option("concurrency", {
      type: "number",
      default: Number(process.env.CODEX_CONCURRENCY ?? DEFAULT_CONCURRENCY),
      describe: "Number of candidates to process in parallel",
    })
    .strict()
    .parse();
}

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

async function confirmCandidate(args: {
  candidate: LocalAiCandidate;
  codex: CodexClient;
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
  const prompt = `${messages[0]!.content}

${messages[1]!.content}

Return only JSON matching the provided output schema. Do not inspect files, run commands, edit files, browse the web, wrap the JSON in Markdown, or add explanatory text. Use only the organization information and webpage content in this prompt.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs);

  try {
    const thread = args.codex.startThread({
      model: args.model,
      workingDirectory: process.cwd(),
      sandboxMode: "read-only",
      approvalPolicy: "never",
      networkAccessEnabled: false,
      webSearchMode: "disabled",
    });
    const turn = await thread.run(prompt, {
      outputSchema,
      signal: controller.signal,
    });

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(extractJsonPayload(turn.finalResponse));
    } catch (error) {
      throw new Error(
        `Malformed structured output: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    }

    const parsed = WebsiteConfirmationSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new Error(`Schema validation failed: ${parsed.error.message}`);
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Codex SDK request timed out after ${args.timeoutMs}ms`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function assertCodexCredentials(): "api-key" | "login" {
  if (process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY) {
    return "api-key";
  }
  return "login";
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

  const authMode = assertCodexCredentials();
  const apiKey = process.env.CODEX_API_KEY || process.env.OPENAI_API_KEY;
  const { Codex } = await import("@openai/codex-sdk");
  const codex = new Codex(apiKey ? { apiKey } : undefined);
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
    `Starting Codex AI confirmation: limit=${limit}, model=${model}, auth=${authMode}, concurrency=${concurrency}, timeoutMs=${timeoutMs}`,
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
      const result = await confirmCandidate({
        candidate,
        codex,
        model,
        timeoutMs,
      });
      const commit = await convex.mutation(commitResultRef, {
        operatorToken,
        orgId: candidate._id,
        model,
        result,
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
    `Codex AI confirmation complete: attempted=${counters.attempted}, committed=${counters.committed}, ready=${counters.ready}, ai_confirmed=${counters.aiConfirmed}, unverifiable=${counters.unverifiable}, failed=${counters.failed}`,
  );
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
