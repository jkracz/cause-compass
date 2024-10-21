import { TaxExemptOrganization } from "../types";
import { findTaxExemptOrgs, bulkUpdateOrgs } from "../db/mongo";
import { fork, ChildProcess } from "child_process";
import pLimit from "p-limit";

const THREAD_LIMIT = 20;
const MAX_ORGS = 1000;
const BATCH_SIZE = 100;

export const parseSearchResults = async (maxOrgs: number = MAX_ORGS) => {
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
                new Promise<void>((resolve) => {
                    const worker = fork("./src/crawlee/confirmationCrawlWorker.ts", [], {
                        env: { ...process.env, ORG_DATA: JSON.stringify(org), WORKER_INDEX: `${org.name}` },
                    });
                    workers.push(worker);
                    // Collect data from worker
                    worker.on("message", (updatedOrg) => {
                        updatedOrgs.push(updatedOrg as TaxExemptOrganization);
                        if (updatedOrgs.length >= BATCH_SIZE) {
                            if (batchUpdatePromise === null) {
                                batchUpdatePromise = updateBatch().finally(() => {
                                    batchUpdatePromise = null;
                                });
                            }
                        }
                    });
                    worker.on("exit", resolve);
                })
        )
    );

    await Promise.all(promises);
    if (updatedOrgs.length > 0) {
        await updateBatch();
    }
};
