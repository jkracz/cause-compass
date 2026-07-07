/**
 * Shared Codex SDK helpers used by the Codex confirmation and research runners.
 */
import { existsSync } from "node:fs";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Codex as CodexClient, Usage } from "@openai/codex-sdk";

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
 * Creates a Codex client whose `CODEX_HOME` points at a throwaway scratch
 * directory instead of the shared `~/.codex`.
 *
 * The batch runners start one Codex thread per organization and never resume
 * them, so the SDK's per-thread rollout files under `~/.codex/sessions` are
 * pure waste. Worse, the Codex desktop app indexes every rollout into its state
 * database, so large research/confirmation runs bloat that database until the
 * app can no longer cope. Isolating `CODEX_HOME` keeps this data out of
 * `~/.codex` entirely, and `cleanup()` deletes the scratch dir so nothing
 * accumulates on disk. Always call `cleanup()` in a `finally`.
 */
export async function createIsolatedCodex(): Promise<{
  codex: CodexClient;
  codexHome: string;
  authMode: "api-key" | "login";
  cleanup: () => Promise<void>;
}> {
  const authMode = assertCodexCredentials();
  const apiKey = process.env.CODEX_API_KEY || process.env.OPENAI_API_KEY;
  const codexHome = await mkdtemp(path.join(os.tmpdir(), "codex-parsley-"));

  // Login-based auth may live in <CODEX_HOME>/auth.json; a fresh scratch home
  // has none, so copy it across when present. Codex can also keep the session in
  // the OS keyring, which a scratch CODEX_HOME still resolves, so a missing or
  // uncopyable auth.json is non-fatal — the SDK surfaces a clear auth error on
  // the first call if there is genuinely no session. API-key auth needs nothing.
  if (authMode === "login") {
    const sourceHome =
      process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
    const source = path.join(sourceHome, "auth.json");
    if (existsSync(source)) {
      try {
        await copyFile(source, path.join(codexHome, "auth.json"));
      } catch {
        // Best-effort: fall back to the keyring-backed session.
      }
    }
  }

  // The SDK's `env` REPLACES process.env for the child process, so forward the
  // existing environment (dropping undefined values to satisfy the typed shape)
  // and then override CODEX_HOME so the redirect always wins.
  const childEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      childEnv[key] = value;
    }
  }
  childEnv.CODEX_HOME = codexHome;

  const { Codex } = await import("@openai/codex-sdk");
  const codex = new Codex({
    ...(apiKey ? { apiKey } : {}),
    env: childEnv,
  });

  return {
    codex,
    codexHome,
    authMode,
    cleanup: () => rm(codexHome, { recursive: true, force: true }),
  };
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
