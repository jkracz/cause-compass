import { TaxExemptOrganization } from "@/types";
import { findTaxExemptOrgs, bulkUpdateOrgs } from "@/db/mongo";
import { fork, ChildProcess } from "child_process";
import pLimit from "p-limit";
import { logger } from "@/utils/logger";

const THREAD_LIMIT = 30;
const MAX_ORGS = 5000;
const BATCH_SIZE = 50;

export const parseSearchResults = async (maxOrgs: number = MAX_ORGS) => {
    try {
        const orgs = await findTaxExemptOrgs(maxOrgs, {
            searchResults: { $exists: true },
            resultsParsedAt: { $exists: false },
        });
        const threadLimit = pLimit(THREAD_LIMIT);

        const updatedOrgs: TaxExemptOrganization[] = [];
        const workers: ChildProcess[] = [];
        let batchUpdatePromise: Promise<void> | null = null;

        process.on("SIGINT", () => {
            console.log("Cancelling...");
            workers.forEach((worker) => worker.kill());
            process.exit();
        });

        const updateBatch = async () => {
            if (updatedOrgs.length > 0) {
                const orgsToUpdate = [...updatedOrgs];
                updatedOrgs.length = 0; // Clear the array
                console.log("Updating batch of", orgsToUpdate.length, "organizations");
                await bulkUpdateOrgs(orgsToUpdate);
            }
        };

        const promises = orgs.map((org) =>
            threadLimit(
                () =>
                    new Promise<void>((resolve, reject) => {
                        const worker = fork("./src/crawlee/confirmationCrawlWorker.ts", [], {
                            env: { ...process.env, ORG_DATA: JSON.stringify(org), WORKER_INDEX: `${org.name}` },
                        });
                        workers.push(worker);

                        worker.on("message", (message) => {
                            if (typeof message === "object" && "error" in message) {
                                logger.error(`Worker error for org ${org.name}:`, message.error);
                                reject(new Error(message?.error as string));
                            } else {
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
                            logger.error(`Worker error for org ${org.name}:`, error);
                            reject(error);
                        });
                        worker.on("exit", (code) => {
                            if (code !== 0) {
                                logger.warn(`Worker for org ${org.name} exited with code ${code}`);
                                reject(new Error(`Worker exited with code ${code}`));
                            } else {
                                resolve();
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
console.time("confirm-websites");
parseSearchResults();
console.timeEnd("confirm-websites");
