import "dotenv/config";
import ollama from "ollama";
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

const DEFAULT_MODEL = "qwen3.6:35b-a3b-coding-nvfp4";
const DEFAULT_LIMIT = 1000;
const DEFAULT_TIMEOUT_MS = 120_000;
const PAGE_SIZE = 25;

/**
 * Applies a soft per-request timeout around the Ollama SDK call while allowing
 * the batch runner to continue processing later organizations.
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
            reject(new Error(`Ollama request timed out after ${timeoutMs}ms`)),
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

/**
 * Reads CLI flags for the local sequential runner, including model and timeout
 * overrides for ad hoc laptop runs.
 */
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
      default: process.env.OLLAMA_MODEL ?? DEFAULT_MODEL,
      describe: "Local Ollama model name",
    })
    .option("timeout-ms", {
      type: "number",
      default: Number(process.env.OLLAMA_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
      describe: "Per-request Ollama timeout",
    })
    .strict()
    .parse();
}

/**
 * Runs one organization through Ollama and validates the structured response
 * against the shared website-confirmation schema before it can be committed.
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
  messages.push({
    role: "user",
    content: `Return only JSON matching this JSON schema. Do not wrap the JSON in Markdown or add explanatory text.\n${JSON.stringify(outputSchema)}`,
  });

  const response = await withTimeout(
    ollama.chat({
      model: args.model,
      messages,
      format: outputSchema,
      think: false,
      options: { temperature: 0 },
    }),
    args.timeoutMs,
  );

  const content = response.message.content;
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
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
}

async function main() {
  const argv = await parseArgs();
  const limit = Math.max(0, Math.floor(argv.limit));
  const model = argv.model;
  const timeoutMs = Math.max(1, Math.floor(argv.timeoutMs));
  const convexUrl = process.env.CONVEX_URL;
  const operatorToken = process.env.LOCAL_AI_OPERATOR_TOKEN;

  if (!convexUrl) {
    throw new Error("Missing CONVEX_URL environment variable");
  }
  if (!operatorToken) {
    throw new Error("Missing LOCAL_AI_OPERATOR_TOKEN environment variable");
  }

  const convex = new ConvexHttpClient(convexUrl);
  const counters = {
    attempted: 0,
    committed: 0,
    failed: 0,
    ready: 0,
    reviewed: 0,
    unverifiable: 0,
  };
  let cursor: string | null = null;
  let isDone = false;

  logger.info(
    `Starting local AI confirmation: limit=${limit}, model=${model}, timeoutMs=${timeoutMs}`,
  );

  while (counters.attempted < limit && !isDone) {
    const page = (await convex.query(listCandidatesRef, {
      operatorToken,
      paginationOpts: {
        numItems: Math.min(PAGE_SIZE, limit - counters.attempted),
        cursor,
      },
    })) as LocalAiCandidatePage;
    isDone = page.isDone;
    cursor = page.continueCursor;

    for (const candidate of page.page) {
      if (counters.attempted >= limit) {
        break;
      }
      counters.attempted++;

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
        continue;
      }

      try {
        const result = await confirmCandidate({ candidate, model, timeoutMs });
        const commit = await convex.mutation(commitResultRef, {
          operatorToken,
          orgId: candidate._id,
          model,
          result,
        });
        counters.committed++;
        if (commit.enrichmentStage === "ready") {
          counters.ready++;
        } else {
          counters.reviewed++;
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
    }
  }

  logger.info(
    `Local AI confirmation complete: attempted=${counters.attempted}, committed=${counters.committed}, ready=${counters.ready}, local_ai_reviewed=${counters.reviewed}, unverifiable=${counters.unverifiable}, failed=${counters.failed}`,
  );
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
