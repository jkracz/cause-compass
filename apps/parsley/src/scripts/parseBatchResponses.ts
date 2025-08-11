import fs from "fs";
import path from "path";
import { connectToDatabase, disconnectFromDatabase } from "@/db/mongo";
import { logger } from "@/utils/logger";
import { processBatchResponseFile } from "@/services/batchResponseProcessor";

const DEFAULT_BATCH_DIR = "data/batch";

async function parseBatchResponses() {
    try {
        // Connect to the database
        await connectToDatabase();

        const batchOutputDir = path.join(
            process.cwd(),
            process.env.BATCH_DIR || DEFAULT_BATCH_DIR,
            "batchOutput",
            "unprocessed"
        );
        // Move the file to the processed folder after processing
        const processedDir = path.join(
            process.cwd(),
            process.env.BATCH_DIR || DEFAULT_BATCH_DIR,
            "batchOutput",
            "processed"
        );

        // Ensure processed directory exists
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        // Read all files in the batchOutput directory
        const files = fs.readdirSync(batchOutputDir).filter((file) => file.endsWith("_output.jsonl"));

        logger.info(`Found ${files.length} batch output files to process`);

        let totalProcessed = 0;
        let totalErrors = 0;

        for (const file of files) {
            try {
                const filePath = path.join(batchOutputDir, file);
                const result = await processBatchResponseFile(filePath, processedDir);
                totalProcessed += result.processedCount;
                totalErrors += result.errorCount;
            } catch (fileError) {
                logger.error(`Error processing file ${file}: ${fileError}`);
            }
        }

        logger.info(
            `Batch response parsing completed. Processed ${totalProcessed} entries with ${totalErrors} errors.`
        );
        return { processedCount: totalProcessed, errorCount: totalErrors };
    } catch (error) {
        logger.error("Error parsing batch responses:", error);
        throw error;
    } finally {
        await disconnectFromDatabase();
    }
}

// Run the function if directly executed
if (require.main === module) {
    parseBatchResponses()
        .then((result) => {
            logger.info(`Script completed successfully: ${JSON.stringify(result)}`);
            process.exit(0);
        })
        .catch((error) => {
            logger.error("Script failed:", error);
            process.exit(1);
        });
}
