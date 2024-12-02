import "dotenv/config";
import { writeConfirmationFile } from "./scripts/generateBatchConfirmationFile";
import { parseSearchResults } from "./scripts/parseSearchResults";
import { logger } from "@/utils/logger";
import path from "path";

const main = async () => {
    try {
        console.log("Starting the application");

        // Test different log levels
        logger.error("This is an error log");
        logger.warn("This is a warning log");
        logger.info("This is an info logoooooooppppps");
        logger.debug("This is a debug log");

        // Check if log files were created
        const logsDir = path.join(process.cwd(), "logs");
        console.log("Checking log files in:", logsDir);

        // if (fs.existsSync(logsDir)) {
        //     const files = fs.readdirSync(logsDir);
        //     console.log("Log files found:", files);
        // } else {
        //     console.log("Logs directory does not exist");
        // }

        // Uncomment and use these functions as needed
        // await parseSearchResults();
        // await writeConfirmationFile();

        console.log("Application completed successfully");
    } catch (error) {
        console.error("An error occurred in the main function", error);
    }
};

main().catch((error) => {
    console.error("Unhandled error in main", error);
    process.exit(1);
});
