import "dotenv/config";
import { writeConfirmationFile } from "./scripts/generateBatchConfirmationFile";
import { parseSearchResults } from "./scripts/parseSearchResults";
import { logger } from "@/utils/logger";
import path from "path";
import { listBatchJobs } from "./services/openAi";

const main = async () => {
  try {
    const batches = await listBatchJobs();
    console.log(batches);
  } catch (error) {
    console.error("An error occurred in the main function", error);
  }
};

main().catch((error) => {
  console.error("Unhandled error in main", error);
  process.exit(1);
});
