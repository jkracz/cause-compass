import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { BatchJob, TaxExemptOrganization } from "../types";
import { findTaxExemptOrgs } from "../db/mongo";
import { logger } from "./logger";
import OpenAI from "openai";
import { writeConfirmationFile } from "../scripts/generateBatchConfirmationFile";
import { processBatchResponseFile } from "./batchResponseProcessor";
import { insertBatchJob, updateBatchJob, findActiveBatchJob } from "../db/mongo";

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
            let job = await this.getActiveBatchJob();
            logger.info(`Checking for active batch job: ${job?.id}`);
            if (!job) {
                // Check for orgs that need processing
                const orgsToProcess = await findTaxExemptOrgs(200, {
                    searchResults: { $exists: true },
                    resultsParsedAt: { $exists: true },
                    aiConfirmationResponse: { $exists: false },
                });

                if (orgsToProcess.length === 0) {
                    logger.info("No organizations need processing");
                    return;
                }

                // Create new batch job
                job = await this.createBatchJob(orgsToProcess.length);
                logger.info(`Created new batch job ${job.id} for ${orgsToProcess.length} organizations`);

                // Generate batch file and immediately upload
                await this.generateBatchFile(job, orgsToProcess);
                await this.uploadBatchFile(job);
                // Refresh job state
                job = await this.getActiveBatchJob();
            }

            // Chain steps for existing jobs
            let keepProcessing = true;
            while (keepProcessing && job) {
                switch (job.status) {
                    case "uploading":
                        await this.uploadBatchFile(job);
                        job = await this.getActiveBatchJob();
                        break;
                    case "processing":
                        await this.checkBatchStatus(job);
                        job = await this.getActiveBatchJob();
                        break;
                    case "downloading":
                        await this.downloadAndProcessResults(job);
                        job = await this.getActiveBatchJob();
                        break;
                    default:
                        keepProcessing = false;
                        break;
                }
            }
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

    private async checkBatchStatus(job: BatchJob): Promise<void> {
        try {
            if (!job.batchId) {
                throw new Error("No batch ID specified");
            }

            const batchStatus = await this.openai.batches.retrieve(job.batchId);

            // See https://platform.openai.com/docs/api-reference/batch/object#batch/object-status
            // Possible statuses: "validating", "failed", "in_progress", "finalizing", "completed", "expired", "cancelling", "cancelled"
            switch (batchStatus.status) {
                case "completed":
                    await this.updateBatchJob(job.id, {
                        status: "downloading",
                        outputFileId: batchStatus.output_file_id,
                    });
                    logger.info(`Batch job ${job.id} is ready for download`);
                    break;
                case "failed": {
                    const errorMsg =
                        Array.isArray(batchStatus.errors) && batchStatus.errors.length > 0
                            ? batchStatus.errors[0].message
                            : JSON.stringify(batchStatus.errors) || "Unknown error";
                    throw new Error(`OpenAI batch failed: ${errorMsg}`);
                }
                case "validating":
                case "in_progress":
                case "finalizing":
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
        } catch (error) {
            logger.error(`Error checking batch status for job ${job.id}:`, error);
            await this.updateBatchJob(job.id, {
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
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
}
