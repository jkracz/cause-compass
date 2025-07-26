import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/parseEoFile";
import { jsonFileWrite } from "../utils/fileWrite";
import { TaxExemptOrganization } from "../types";
import slugify from "slugify";
import * as path from "path";
import { insertManyTaxExemptOrgs } from "../db/mongo";
import { logger } from "@/utils/logger";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Configuration constants
const BATCH_SIZE = 5000; // Number of records to insert in each database batch
const DATA_DIR = "data";

/**
 * Determines if a tax-exempt organization meets the criteria for insertion into the database.
 * Filters out organizations that are:
 * - Not deductible (deductibility code !== "1")
 * - Religious organizations (activity codes containing "Religious Activities")
 * - Government affiliates (affiliation code === "9")
 * - Organizations with specific filing requirement codes (06, 13, 14, 00)
 * - Private foundations (foundation codes 02, 03, 04, 10)
 * - Organizations with specific status codes (12, 25)
 * 
 * @param eo - The tax-exempt organization to evaluate
 * @returns true if the organization meets all criteria, false otherwise
 */
const meetsCriteria = (eo: TaxExemptOrganization) => {
    const { deductibility, activityCodes, affiliation, filingReqCode, foundation, status } = eo;
    if (
        deductibility.code !== "1" ||
        activityCodes?.some((code) => code.category === "Religious Activities") ||
        affiliation.code === "9" ||
        filingReqCode.code === "06" ||
        filingReqCode.code === "13" ||
        filingReqCode.code === "14" ||
        filingReqCode.code === "00" ||
        foundation.code === "02" ||
        foundation.code === "03" ||
        foundation.code === "04" ||
        foundation.code === "10" ||
        status.code === "12" ||
        status.code === "25"
    ) {
        return false;
    }
    return true;
};

/**
 * Processes tax-exempt organization data for a specific state.
 * 
 * This script:
 * 1. Parses CSV data from the IRS EO (Exempt Organizations) file for the specified state
 * 2. Filters organizations based on predefined criteria
 * 3. Generates unique database IDs and URL slugs for each organization
 * 4. Inserts qualifying organizations into the database in batches
 * 5. Saves all parsed profiles to JSON files for reference
 * 6. Logs processing metrics and results
 * 
 * @param state - The state abbreviation (e.g., "CA", "NY") to process
 */
const createOrgsByState = async (state: string) => {
    try {
        // Parse the profiles from the EO file for the specified state
        const fileName: string = "eo_" + state.toLowerCase() + ".csv";
        const parsedProfiles: Record<string, TaxExemptOrganization> = await parseEoFile(fileName);

        // Create a batch array to accumulate records for efficient database insertion
        let dbBatch: TaxExemptOrganization[] = [];

        // Initialize metrics for logging and monitoring
        let totalInserted: number = 0;
        let totalNotInserted: number = 0;
        let totalFilesWritten: number = 0;
        let totalProfilesParsed: number = 0;

        // Process each organization in the parsed data
        for (const ein in parsedProfiles) {
            const profile: TaxExemptOrganization = parsedProfiles[ein];
            totalProfilesParsed += 1;
            
            // Generate unique database ID and URL-friendly slug
            profile.dbId = generateId();
            profile.slug = `${slugify(profile.name, { lower: true })}-${ein.slice(-4)}`;
            
            // Apply filtering criteria and add to batch if qualified
            if (meetsCriteria(profile)) {
                dbBatch.push(profile);
            } else {
                totalNotInserted += 1;
            }
            
            // Insert batch when it reaches the configured size
            if (dbBatch.length >= BATCH_SIZE) {
                await insertManyTaxExemptOrgs(dbBatch);
                dbBatch = [];
                totalInserted += BATCH_SIZE;
            }
        }
        
        // Insert any remaining records in the final batch
        if (dbBatch.length > 0) {
            await insertManyTaxExemptOrgs(dbBatch);
            totalInserted += dbBatch.length;
            logger.info(`Inserted final batch of ${dbBatch.length} records to the database.`);
            dbBatch = [];
        }
        
        // Save all parsed profiles to JSON file for reference and backup
        const outputDirectoryPath: string = path.join(__dirname, `${DATA_DIR}/nonprofitProfiles`);
        await jsonFileWrite(outputDirectoryPath, parsedProfiles, state);
        totalFilesWritten += 1;
        
        // Log comprehensive processing results
        logger.info(`Processing for ${state} completed.`);
        logger.info(`- ${totalProfilesParsed} profile(s) parsed.`);
        logger.info(`- ${totalInserted} profile(s) inserted.`);
        logger.info(`- ${totalNotInserted} profile(s) selectively NOT inserted.`);
        logger.info(`- ${totalFilesWritten} file(s) written.`);
    } catch (error) {
        logger.error(`Error processing ${state} profiles.`, error);
    }
};

/**
 * Main entry point for the script.
 * 
 * Usage: pnpm run createOrgsByState --state=CA
 * 
 * Requires a --state command line argument specifying the state to process.
 * The state should be provided as a two-letter abbreviation (e.g., "CA", "NY").
 */
const main = async () => {
    const argv = await yargs(hideBin(process.argv)).argv;
    const state = argv.state as string;
    if (state) {
        await createOrgsByState(state.toLowerCase());
    } else {
        logger.error("Please provide a state using --state");
        process.exit(1);
    }
};

main();
