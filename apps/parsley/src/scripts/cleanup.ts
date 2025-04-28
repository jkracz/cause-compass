import dotenv from "dotenv";
import { connectToDatabase, disconnectFromDatabase } from "../db/mongo";
import { BatchManager } from "../utils/batchManager";
import { logger } from "../utils/logger";

dotenv.config();

async function main() {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required");
    }

    try {
        // Connect to database
        await connectToDatabase();
        logger.info("Connected to database");

        // Create batch manager and run cleanup
        const batchManager = new BatchManager(openaiApiKey);
        await batchManager.cleanup();

        logger.info("Cleanup completed successfully");
    } catch (error) {
        logger.error("Error during cleanup:", error);
        process.exit(1);
    } finally {
        await disconnectFromDatabase();
    }
}

// Run if this script is run directly
if (require.main === module) {
    main();
}
