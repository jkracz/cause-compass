import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { BatchJob, TaxExemptOrganization } from "../types";
import { findTaxExemptOrgs } from "../db/mongo";
import { logger } from "./logger";
import OpenAI from "openai";
import { writeConfirmationFile } from "../scripts/generateBatchConfirmationFile";
import { processBatchResponseFile } from "./batchResponseProcessor";
import { insertBatchJob, updateBatchJob, findActiveBatchJob, getBatchCollection } from "../db/mongo";

const DEFAULT_BATCH_SIZE = 10;
export class BatchManager {
    private openai: OpenAI;
    private tempDir: string;

    constructor(openaiApiKey: string, tempDir: string = path.join(process.cwd(), "temp")) {
        logger.info("Initializing BatchManager");
        try {
            this.openai = new OpenAI({ apiKey: openaiApiKey });
            this.tempDir = tempDir;
        } catch (error) {
            logger.error("Error initializing BatchManager:", error);
            throw error;
        }

        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    private async createBatchJob(batchSize: number): Promise<BatchJob> {
        const job: BatchJob = {
            id: nanoid(),
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            batchSize,
        };
        await insertBatchJob(job);
        return job;
    }

    private async updateBatchJob(jobId: string, updates: Partial<BatchJob>): Promise<void> {
        await updateBatchJob(jobId, updates);
    }

    async getActiveBatchJob(): Promise<BatchJob | null> {
        return findActiveBatchJob();
    }

    async checkAndProcessBatch(): Promise<void> {
        try {
            const job = await this.getActiveBatchJob();
            logger.info(`Checking for active batch job: ${job?.id}`);

            if (job) {
                // Check if the job needs to be processed or moved forward
                if (job.status === "processing") {
                    // Check current status once
                    logger.info(`Checking status for job ${job.id}`);
                    const jobId = job.id; // Remember the job ID
                    await this.checkBatchStatus(job);

                    // After checking batch status, get all job data directly from database
                    // since findActiveBatchJob won't return 'failed' jobs
                    const batches = await getBatchCollection();
                    const updatedJob = await batches.findOne({ id: jobId });

                    if (!updatedJob) {
                        logger.error(`Job ${jobId} not found after status check`);
                        await this.startNewBatchJob();
                        return;
                    }

                    // Now handle both completed and failed cases
                    if (updatedJob.status === "downloading") {
                        logger.info(`Job ${updatedJob.id} is now ready for download, processing immediately`);
                        await this.downloadAndProcessResults(updatedJob);

                        // After processing results, automatically start a new batch
                        await this.startNewBatchJob();
                        return;
                    } else if (updatedJob.status === "failed") {
                        logger.info(`Job ${updatedJob.id} has failed, starting a new batch job`);
                        await this.startNewBatchJob();
                        return;
                    }

                    // If still processing, just exit
                    return;
                }

                // Handle other statuses as before
                switch (job.status) {
                    case "uploading":
                        // Resume from uploading state
                        logger.info(`Resuming upload for job ${job.id}`);
                        await this.uploadBatchFile(job);
                        return;

                    case "downloading":
                        // Process the results of a completed job
                        logger.info(`Processing results for job ${job.id}`);
                        await this.downloadAndProcessResults(job);

                        // After processing results, automatically start a new batch
                        await this.startNewBatchJob();
                        return;

                    case "completed":
                    case "failed":
                        // Job is done, immediately start a new batch
                        logger.info(`Job ${job.id} is ${job.status}, starting a new batch job`);
                        await this.startNewBatchJob();
                        return;

                    default:
                        // For any other status, just exit and wait for next run
                        logger.info(`Job ${job.id} has status ${job.status}, no action needed`);
                        return;
                }
            }

            // No active job, start a new one
            await this.startNewBatchJob();
        } catch (error) {
            logger.error("Error in checkAndProcessBatch:", error);
            throw error;
        }
    }

    private async generateBatchFile(job: BatchJob, orgs: TaxExemptOrganization[]): Promise<void> {
        try {
            await this.updateBatchJob(job.id, { status: "generating" });

            const batchDir = path.join(this.tempDir, job.id);
            fs.mkdirSync(batchDir, { recursive: true });

            logger.info(`Generating batch file in directory: ${batchDir}`);

            // Use the existing file generation logic with our parameters
            const inputFilePath = await writeConfirmationFile({
                batchDir,
                batchSize: orgs.length,
                organizations: orgs,
            });

            logger.info(`Generated batch file at path: ${inputFilePath}`);

            // Verify the file exists
            if (!fs.existsSync(inputFilePath)) {
                throw new Error(`Generated file does not exist at path: ${inputFilePath}`);
            }

            await this.updateBatchJob(job.id, {
                status: "uploading",
                inputFile: inputFilePath,
                totalCount: orgs.length,
            });

            logger.info(`Generated batch file for job ${job.id}`);
        } catch (error) {
            logger.error(`Error generating batch file for job ${job.id}:`, error);
            await this.updateBatchJob(job.id, {
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    private async uploadBatchFile(job: BatchJob): Promise<void> {
        try {
            // Fetch the latest job data to ensure we have the updated inputFile path
            const updatedJob = await findActiveBatchJob();
            if (updatedJob && updatedJob.id === job.id) {
                job = updatedJob;
            }

            if (!job.inputFile) {
                throw new Error("No input file specified");
            }

            // 1. Upload the input file with purpose 'batch'
            const inputFile = await this.openai.files.create({
                file: fs.createReadStream(job.inputFile),
                purpose: "batch",
            });

            // 2. Create the batch job
            const batch = await this.openai.batches.create({
                input_file_id: inputFile.id,
                endpoint: "/v1/chat/completions",
                completion_window: "24h",
                metadata: { jobId: job.id },
            });

            await this.updateBatchJob(job.id, {
                status: "processing",
                fileId: inputFile.id,
                batchId: batch.id,
            });

            logger.info(
                `Created OpenAI batch for job ${job.id}, batch ID: ${batch.id}, input file ID: ${inputFile.id}`
            );
        } catch (error) {
            logger.error(`Error uploading batch file for job ${job.id}:`, error);
            await this.updateBatchJob(job.id, {
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    private async checkBatchStatus(job: BatchJob): Promise<"downloading" | "failed" | "processing"> {
        try {
            if (!job.batchId) {
                throw new Error("No batch ID specified");
            }

            const batchStatus = await this.openai.batches.retrieve(job.batchId);

            switch (batchStatus.status) {
                case "completed":
                    await this.updateBatchJob(job.id, {
                        status: "downloading",
                        outputFileId: batchStatus.output_file_id,
                    });
                    logger.info(`Batch job ${job.id} is ready for download`);
                    return "downloading";

                case "failed": {
                    const errorMsg =
                        Array.isArray(batchStatus.errors) && batchStatus.errors.length > 0
                            ? batchStatus.errors[0].message
                            : JSON.stringify(batchStatus.errors) || "Unknown error";
                    logger.error(`OpenAI batch failed: ${errorMsg}`);
                    await this.updateBatchJob(job.id, {
                        status: "failed",
                        error: `OpenAI batch failed: ${errorMsg}`,
                    });
                    return "failed";
                }
                case "validating":
                case "in_progress":
                case "finalizing":
                    // Only log status, no action needed
                    logger.info(`Batch job ${job.id} is still processing (status: ${batchStatus.status})`);
                    break;
                case "expired":
                case "cancelling":
                case "cancelled":
                    logger.error(`Batch job ${job.id} ended with status: ${batchStatus.status}`);
                    await this.updateBatchJob(job.id, {
                        status: "failed",
                        error: `Batch ended with status: ${batchStatus.status}`,
                    });
                    break;
                default:
                    logger.warn(`Unknown batch status: ${batchStatus.status}`);
                    break;
            }
            return "processing";
        } catch (error) {
            // Only log the error but don't throw it - we don't want to fail the job just because we couldn't check it
            if (error instanceof Error && error.message.includes("429")) {
                logger.warn(`Rate limit hit checking batch status for job ${job.id}, will retry later`);
            } else {
                logger.error(`Error checking batch status for job ${job.id}:`, error);
            }
            return "processing";
        }
    }

    private async downloadAndProcessResults(job: BatchJob): Promise<void> {
        try {
            if (!job.outputFileId) {
                throw new Error("No output file ID specified");
            }

            const jobDir = path.join(this.tempDir, job.id);
            const outputFilePath = path.join(jobDir, "output.jsonl");
            const processedDir = path.join(jobDir, "processed");

            // Ensure processed directory exists
            if (!fs.existsSync(processedDir)) {
                fs.mkdirSync(processedDir, { recursive: true });
            }

            // Download the results
            const output = await this.openai.files.content(job.outputFileId);
            const outputText = await output.text();
            fs.writeFileSync(outputFilePath, outputText);

            // Process the results
            const { processedCount, errorCount } = await processBatchResponseFile(outputFilePath, processedDir);

            // Update job status
            await this.updateBatchJob(job.id, {
                status: "completed",
                outputFile: outputFilePath,
                processedCount,
                error: errorCount > 0 ? `Processed with ${errorCount} errors` : undefined,
            });

            logger.info(
                `Downloaded and processed results for batch job ${job.id}. Processed ${processedCount} entries with ${errorCount} errors.`
            );
        } catch (error) {
            logger.error(`Error downloading results for batch job ${job.id}:`, error);
            await this.updateBatchJob(job.id, {
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    // Helper method to check if there are organizations to process
    private async checkForOrgsToProcess(): Promise<TaxExemptOrganization[]> {
        return findTaxExemptOrgs(DEFAULT_BATCH_SIZE, {
            searchResults: { $exists: true },
            resultsParsedAt: { $exists: true },
            aiConfirmationResponse: { $exists: false },
        });
    }

    // Helper method to start a new batch job if organizations are available
    private async startNewBatchJob(): Promise<boolean> {
        const orgsToProcess = await this.checkForOrgsToProcess();

        if (orgsToProcess.length === 0) {
            logger.info("No organizations need processing");
            return false;
        }

        // Create new batch job
        const job = await this.createBatchJob(orgsToProcess.length);
        logger.info(`Created new batch job ${job.id} for ${orgsToProcess.length} organizations`);

        try {
            // Generate batch file and start the process
            await this.generateBatchFile(job, orgsToProcess);
            await this.uploadBatchFile(job);
            logger.info(`Successfully initiated batch processing for job ${job.id}`);
            return true;
        } catch (processingError) {
            logger.error(`Error in batch processing: ${processingError}`);
            // Mark job as failed
            await this.updateBatchJob(job.id, {
                status: "failed",
                error: processingError instanceof Error ? processingError.message : "Unknown error",
            });
            return false;
        }
    }
}
