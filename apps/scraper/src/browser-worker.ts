import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";
import { config } from "./config.js";
import {
  claimJob,
  completeJob,
  failJob,
  type ClaimedJob,
} from "./convex-client.js";
import { extractAll } from "./extractors/index.js";
import { DomainThrottle } from "./throttle.js";
import { startHealthReporter } from "./health.js";

const USER_AGENT =
  "Mozilla/5.0 (compatible; CauseCompassBot/1.0; +https://causecompass.org)";

const throttle = new DomainThrottle(config.domainThrottleMs);

let shuttingDown = false;
let activeJobs = 0;
let browser: Browser | null = null;

const health = startHealthReporter(() => ({
  workerType: "browser",
  shuttingDown,
  activeJobs,
}));

function log(level: string, msg: string, data?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    worker: config.workerId,
    msg,
    ...data,
  };
  console.log(JSON.stringify(entry));
}

async function getBrowser(): Promise<Browser> {
  if (browser && browser.isConnected()) {
    return browser;
  }

  browser = await chromium.launch({
    headless: config.browserHeadless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-gpu",
      "--no-first-run",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
    ],
  });

  return browser;
}

async function processJob(job: ClaimedJob): Promise<void> {
  activeJobs++;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    await throttle.wait(job.url);

    const b = await getBrowser();
    context = await b.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
    });
    page = await context.newPage();
    page.setDefaultNavigationTimeout(config.browserNavigationTimeoutMs);

    const response = await page.goto(job.url, {
      waitUntil: "domcontentloaded",
      timeout: config.browserNavigationTimeoutMs,
    });

    if (!response) {
      throw new Error("No response received during navigation");
    }

    await page.waitForTimeout(config.browserWaitAfterLoadMs);
    const html = await page.content();

    const result = extractAll(html, job.url);
    await completeJob(job.jobId, result);

    log("info", "Completed", {
      ein: job.ein,
      url: job.url,
      status: response.status(),
      textLen: result.textContent?.length ?? 0,
      attempt: job.attemptCount + 1,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown browser processing error";
    try {
      await failJob(job.jobId, message);
    } catch {
      log("error", "Failed to report failure", {
        jobId: job.jobId,
        error: message,
      });
    }
    log("error", "Processing error", {
      ein: job.ein,
      url: job.url,
      error: message,
      attempt: job.attemptCount + 1,
    });
  } finally {
    activeJobs--;
    await page?.close().catch(() => undefined);
    await context?.close().catch(() => undefined);
  }
}

async function pollLoop(): Promise<void> {
  log("info", "Starting browser worker", {
    concurrency: config.concurrency,
    pollInterval: config.pollIntervalMs,
    headless: config.browserHeadless,
  });

  const pruneInterval = setInterval(() => throttle.prune(), 30_000);

  while (!shuttingDown) {
    if (activeJobs >= config.concurrency) {
      await sleep(100);
      continue;
    }

    const job = await claimJob("browser").catch((err) => {
      log("error", "Claim error", {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    });

    if (!job) {
      await sleep(config.pollIntervalMs);
      continue;
    }

    processJob(job);
  }

  clearInterval(pruneInterval);

  log("info", "Draining active jobs", { activeJobs });
  while (activeJobs > 0) {
    await sleep(200);
  }

  await browser?.close().catch(() => undefined);
  health.stop();
  log("info", "Shutdown complete");
}

function onSignal(signal: string) {
  log("info", `Received ${signal}, shutting down`);
  shuttingDown = true;
  health.writeNow();
}

process.on("SIGTERM", () => onSignal("SIGTERM"));
process.on("SIGINT", () => onSignal("SIGINT"));

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

pollLoop().catch((err) => {
  log("error", "Fatal error", {
    error: err instanceof Error ? err.message : String(err),
  });
  health.stop();
  process.exit(1);
});

process.on("exit", () => {
  health.stop();
});

