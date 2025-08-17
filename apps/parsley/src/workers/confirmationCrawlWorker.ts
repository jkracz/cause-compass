import { createCrawler, getCrawlDataAsArray } from "../services/crawler";
import { createAcronym, findBestUrls } from "../utils/parseUtils";
import { CrawlItem } from "../types";
import { logger } from "@/utils/logger";
import { PlaywrightCrawler } from "crawlee";

let confirmationCrawler: PlaywrightCrawler | undefined;
const TIMEOUT = 5 * 60 * 1000;
let isShuttingDown = false;

const shutdown = async (reason: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Initiating shutdown: ${reason}`);
    if (confirmationCrawler) {
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await confirmationCrawler.teardown();
        } catch (error) {
            logger.error("Error during crawler teardown:", error);
        }
    }
    if (process.send && reason.includes("error") && !reason.includes("Channel closed")) {
        process.send({
            error: reason,
            stack: new Error().stack,
            orgData: process.env.ORG_DATA,
        });
        process.exit(1);
    }
    process.exit(0);
};

(async () => {
    const timeout = setTimeout(() => {
        shutdown("Worker timeout exceeded");
    }, TIMEOUT);

    try {
        const org = JSON.parse(process.env.ORG_DATA!);
        const acronym = createAcronym(org.name);

        // Debug logging
        logger.info(`Processing org: ${org.name}`);

        // Clean up any existing storage for this worker to prevent stale data
        const fs = require("fs");
        const path = require("path");
        const storageDir = path.resolve(__dirname, `../../storage/worker-${org.name}`);
        if (fs.existsSync(storageDir)) {
            try {
                fs.rmSync(storageDir, { recursive: true, force: true });
                logger.info(`Cleaned up storage for ${org.name}`);
            } catch (error) {
                logger.warn(`Failed to clean storage for ${org.name}:`, error);
            }
        }

        const bestUrls = findBestUrls(org, acronym);
        logger.info(`Best URLs found: ${bestUrls.length}`, bestUrls);

        confirmationCrawler = await createCrawler({
            addLinks: false,
            datasetName: org.name,
            requestQueueName: org.name,
            maxRequestRetries: 2,
            worker: true,
        });

        // Convert URLs to proper format for crawler
        const requests = bestUrls.map((url) => ({ url }));
        logger.info(`Adding ${requests.length} requests to crawler`);

        if (requests.length > 0) {
            // Add requests to the crawler's request queue
            const requestQueue = confirmationCrawler.requestQueue;
            if (requestQueue) {
                await requestQueue.addRequests(requests);
            } else {
                logger.error("Request queue is not available");
                return;
            }

            await confirmationCrawler.run();
        } else {
            logger.warn("No URLs to crawl");
        }

        const crawlItems: CrawlItem[] = await getCrawlDataAsArray(org.name, true);

        org.confirmationCrawlItems = crawlItems;
        org.resultsParsedAt = new Date().toISOString();

        if (process.send) {
            process.send(org);
        } else {
            logger.error("Process.send is not available");
        }
    } catch (error) {
        clearTimeout(timeout);
        if (!isShuttingDown) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            logger.error(`Error in confirmationCrawlWorker: ${errorMessage}`);
            if (process.send) {
                process.send({
                    error: errorMessage,
                    stack: error instanceof Error ? error.stack : undefined,
                    orgData: process.env.ORG_DATA,
                });
            }
            await shutdown(`Error in worker execution: ${errorMessage}`);
        }
    } finally {
        clearTimeout(timeout);
    }
})();

// error is getting handled here
process.on("uncaughtException", async (error) => {
    logger.error("Uncaught Exception:", error);
    // Only shutdown on critical errors, ignore browser connection issues
    const ignorableErrors = [
        "Channel closed",
        "Connection closed",
        "Target closed",
        "browser has been closed",
        "Protocol error",
    ];

    if (!ignorableErrors.some((msg) => error.message.includes(msg))) {
        await shutdown("Uncaught exception");
    }
});

process.on("unhandledRejection", async (reason) => {
    logger.error("Unhandled Rejection:", reason);
    await shutdown("Unhandled rejection");
});

process.on("message", async (message: { action: string }) => {
    if (message.action === "shutdown") {
        await shutdown("Received shutdown message");
    }
});
