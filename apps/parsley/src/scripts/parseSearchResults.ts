import { TaxExemptOrganization } from "@/types";
import { findTaxExemptOrgs, bulkUpdateOrgs } from "@/services/mongo";
import { fork, ChildProcess } from "child_process";
import pLimit from "p-limit";
import { logger } from "@/utils/logger";
import fs from "fs";
import path from "path";

const THREAD_LIMIT = 35;
const MAX_ORGS = 5000;
const BATCH_SIZE = 50;
const WORKER_TIMEOUT = 6 * 60 * 1000;

export const parseSearchResults = async (maxOrgs: number = MAX_ORGS) => {
    try {
        const orgs = await findTaxExemptOrgs(maxOrgs, {
            $and: [
                { searchResults: { $exists: true } },
                { searchResults: { $type: "array" } },
                { resultsParsedAt: { $exists: false } },
            ],
        });
        const threadLimit = pLimit(THREAD_LIMIT);

        const updatedOrgs: TaxExemptOrganization[] = [];
        const workers: ChildProcess[] = [];
        let batchUpdatePromise: Promise<void> | null = null;

        process.on("SIGINT", async () => {
            console.log("Cancelling...");
            if (updatedOrgs.length > 0) {
                await updateBatch();
            }
            workers.forEach((worker) => worker.kill());
            cleanupStorage();
            process.exit();
        });

        const updateBatch = async () => {
            if (updatedOrgs.length > 0) {
                const orgsToUpdate = [...updatedOrgs];
                updatedOrgs.length = 0;
                logger.info("Updating batch of", orgsToUpdate.length, "organizations");
                await bulkUpdateOrgs(orgsToUpdate);
            }
        };

        const promises = orgs.map((org) =>
            threadLimit(
                () =>
                    new Promise<void>((resolve, reject) => {
                        let workerFinished = false;

                        const worker = fork("./src/workers/confirmationCrawlWorker.ts", [], {
                            env: { ...process.env, ORG_DATA: JSON.stringify(org), WORKER_INDEX: `${org.name}` },
                        });
                        workers.push(worker);

                        const workerTimeout = setTimeout(() => {
                            if (!workerFinished) {
                                logger.error(`Worker timeout for org ${org.name}`);
                                worker.send({ action: "shutdown" });
                                setTimeout(() => {
                                    if (workers.includes(worker)) {
                                        worker.kill("SIGKILL");
                                    }
                                }, 5000);
                            }
                        }, WORKER_TIMEOUT);

                        const cleanup = () => {
                            if (!workerFinished) {
                                workerFinished = true;
                                clearTimeout(workerTimeout);
                                cleanupWorker(worker, workers);
                            }
                        };

                        worker.on("message", (message) => {
                            if (typeof message === "object" && "error" in message) {
                                cleanup();
                                logger.error(`Worker error for org ${org.name}:`, {
                                    error: message.error,
                                    stack: (message as { error: unknown; stack?: string }).stack,
                                    orgData: (message as { error: unknown; orgData?: unknown }).orgData,
                                });
                                reject(new Error(message.error as string));
                            } else if (typeof message === "object" && "confirmationCrawlItems" in message) {
                                cleanup();
                                updatedOrgs.push(message as TaxExemptOrganization);
                                if (updatedOrgs.length >= BATCH_SIZE) {
                                    if (batchUpdatePromise === null) {
                                        batchUpdatePromise = updateBatch().finally(() => {
                                            batchUpdatePromise = null;
                                        });
                                    }
                                }
                                resolve();
                            }
                        });

                        worker.on("error", (error) => {
                            cleanup();
                            logger.error(`Worker error for org ${org.name}:`, error);
                            reject(error);
                        });

                        worker.on("exit", (code) => {
                            cleanup();
                            if (code !== 0 && !workerFinished) {
                                reject(new Error(`Worker exited with code ${code}`));
                            }
                        });
                    })
            )
        );

        await Promise.all(promises);
        if (updatedOrgs.length > 0) {
            await updateBatch();
        }
    } catch (error) {
        logger.error("Error in parseSearchResults:", error);
        throw error;
    }
};

const cleanupWorker = (worker: ChildProcess, workers: ChildProcess[]) => {
    const workerIndex = workers.indexOf(worker);
    if (workerIndex > -1) {
        workers.splice(workerIndex, 1);
        try {
            worker.kill("SIGTERM");
        } catch (error) {
            logger.warn("Error killing worker:", error);
        }
    }
};

const cleanupStorage = () => {
    try {
        const storageDir = path.resolve(__dirname, "../../storage");
        if (fs.existsSync(storageDir)) {
            fs.rmSync(storageDir, { recursive: true, force: true });
            logger.info("Storage directory cleaned up successfully");
        }
    } catch (error) {
        logger.error("Error cleaning up storage directory:", error);
    }
};

process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM. Cleaning up...");
    cleanupStorage();
    process.exit();
});

const main = async () => {
    console.time("confirm-websites");
    await parseSearchResults();
    await cleanupStorage();
    console.timeEnd("confirm-websites");
    process.exit(0);
};

main().catch((error) => {
    logger.error("Error in main:", error);
    process.exit(1);
});
