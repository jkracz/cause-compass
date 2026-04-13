import { config } from "./config.js";
import {
  claimJob,
  completeJob,
  failJob,
  enqueueJob,
  type ClaimedJob,
} from "./convex-client.js";
import { extractAll } from "./extractors/index.js";
import { checkFallback } from "./fallback.js";
import { DomainThrottle } from "./throttle.js";
import { startHealthReporter } from "./health.js";

const FETCH_TIMEOUT_MS = 30_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; CauseCompassBot/1.0; +https://causecompass.org)";
const DISALLOWED_HOST_SUFFIXES = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "x.com",
  "twitter.com",
  "threads.net",
  "youtube.com",
  "youtu.be",
  "indeed.com",
  "yelp.com",
  "tripadvisor.com",
  "tripadvisor.in",
  "hotels.com",
  "airbnb.com",
  "rvshare.com",
];
const DISALLOWED_PATH_EXTENSIONS = [
  ".pdf",
  ".csv",
  ".tsv",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".7z",
  ".xml",
  ".json",
  ".txt",
];

const throttle = new DomainThrottle(config.domainThrottleMs);

let shuttingDown = false;
let activeJobs = 0;
const health = startHealthReporter(() => ({
  workerType: "html",
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

function shouldSkipDirectHtmlCrawl(url: string): string | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return "invalid_url";
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();
  const hasDisallowedHost = DISALLOWED_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );

  if (hasDisallowedHost) {
    return "disallowed_host";
  }

  const hasDisallowedExtension = DISALLOWED_PATH_EXTENSIONS.some((ext) =>
    pathname.endsWith(ext),
  );
  if (hasDisallowedExtension) {
    return "disallowed_extension";
  }

  return null;
}

function isSkippableContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const normalized = contentType.toLowerCase();
  if (
    normalized.includes("text/html") ||
    normalized.includes("application/xhtml+xml")
  ) {
    return false;
  }

  return true;
}

async function processJob(job: ClaimedJob): Promise<void> {
  activeJobs++;
  try {
    const skipReason = shouldSkipDirectHtmlCrawl(job.url);
    if (skipReason) {
      await completeJob(job.jobId);
      log("info", "Skipping low-value HTML candidate", {
        ein: job.ein,
        url: job.url,
        reason: skipReason,
      });
      return;
    }

    // Throttle per domain
    await throttle.wait(job.url);

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(job.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        redirect: "follow",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Fetch failed";
      // Network errors or timeouts — retry via fail
      await failJob(job.jobId, message);
      log("warn", "Fetch error", { ein: job.ein, url: job.url, error: message });
      return;
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get("content-type");
    if (isSkippableContentType(contentType)) {
      await completeJob(job.jobId);
      log("info", "Skipping non-HTML response", {
        ein: job.ein,
        url: job.url,
        contentType,
      });
      return;
    }

    const html = await response.text();

    // Check fallback heuristics
    const fallback = checkFallback(response.status, response.headers, html);

    if (fallback.shouldFallback) {
      log("info", "Escalating to browser", {
        ein: job.ein,
        url: job.url,
        reason: fallback.reason,
      });

      // Enqueue browser job
      await enqueueJob({
        queueType: "browser",
        orgId: job.orgId,
        ein: job.ein,
        url: job.url,
        fallbackReason: fallback.reason,
      });

      // Complete the HTML job without recording a crawl result so it doesn't
      // retry and create duplicate browser jobs. The browser worker will
      // produce the actual extraction result.
      await completeJob(job.jobId);
      return;
    }

    // Non-200 but not a fallback case (e.g., 404, 500)
    if (!response.ok) {
      await failJob(job.jobId, `HTTP ${response.status}`);
      log("warn", "HTTP error", {
        ein: job.ein,
        url: job.url,
        status: response.status,
      });
      return;
    }

    // Extract content
    const result = extractAll(html, job.url);

    // Complete the job
    await completeJob(job.jobId, result);
    log("info", "Completed", {
      ein: job.ein,
      url: job.url,
      textLen: result.textContent?.length ?? 0,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown processing error";
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
    });
  } finally {
    activeJobs--;
  }
}

async function pollLoop(): Promise<void> {
  log("info", "Starting HTML worker", {
    concurrency: config.concurrency,
    pollInterval: config.pollIntervalMs,
  });

  // Prune throttle entries every 30s
  const pruneInterval = setInterval(() => throttle.prune(), 30_000);

  while (!shuttingDown) {
    // Fill up to concurrency
    if (activeJobs >= config.concurrency) {
      await sleep(100);
      continue;
    }

    const job = await claimJob("html").catch((err) => {
      log("error", "Claim error", {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    });

    if (!job) {
      // No jobs available — wait and poll again
      await sleep(config.pollIntervalMs);
      continue;
    }

    // Fire and forget (respects concurrency via activeJobs counter)
    processJob(job);
  }

  clearInterval(pruneInterval);

  // Wait for in-flight jobs to finish
  log("info", "Draining active jobs", { activeJobs });
  while (activeJobs > 0) {
    await sleep(200);
  }
  log("info", "Shutdown complete");
  health.stop();
}

// Graceful shutdown
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

// Start
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
