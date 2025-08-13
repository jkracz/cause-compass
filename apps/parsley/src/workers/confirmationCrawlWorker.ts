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
        const bestUrls = findBestUrls(org, acronym);

        confirmationCrawler = await createCrawler({
            addLinks: false,
            datasetName: org.name,
            requestQueueName: org.name,
            maxRequestRetries: 2,
            worker: true,
        });

        await confirmationCrawler.run(bestUrls);

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
    // Only shutdown on non-channel-closed errors
    if (!error.message.includes("Channel closed")) {
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
