import { connectToDatabase, disconnectFromDatabase } from "../services/mongo";
import { BatchManager } from "../services/batchManager";
import { logger } from "../utils/logger";
import "dotenv/config";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

async function main() {
  try {
    // Connect to MongoDB first
    await connectToDatabase();
    logger.info("Connected to MongoDB");

    const batchManager = new BatchManager(
      OPENAI_API_KEY as string,
      process.env.BATCH_DIR
    );
    logger.info("BatchManager initialized");

    // Process batches
    await batchManager.checkAndProcessBatch();

    logger.info("Batch processing completed");
  } catch (error) {
    logger.error(
      "Error in batch processing:",
      error instanceof Error ? error.stack || error.message : "Unknown error",
    );
    process.exit(1);
  } finally {
    await disconnectFromDatabase();
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(
        "Script failed:",
        error instanceof Error ? error.stack || error.message : "Unknown error",
      );
      process.exit(1);
    });
}
