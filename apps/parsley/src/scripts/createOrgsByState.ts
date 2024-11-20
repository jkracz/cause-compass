import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/parseEoFile";
import { jsonFileWrite } from "../utils/fileWrite";
import { TaxExemptOrganization } from "../types";
import slugify from "slugify";
import * as path from "path";
import { insertManyTaxExemptOrgs } from "../db/mongo";
import { logger } from "@/utils/logger";

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv)).argv;

const BATCH_SIZE = 5000;

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

const createOrgsByState = async (state: string) => {
    try {
        // parse the profiles from the eo file
        const fileName: string = "eo_" + state.toLowerCase() + ".csv";
        const parsedProfiles: Record<string, TaxExemptOrganization> = await parseEoFile(fileName);

        // create a batch so we don't insert profiles 1 by 1
        let dbBatch: TaxExemptOrganization[] = [];

        // init some metrics for logging at the end
        let totalInserted: number = 0;
        let totalNotInserted: number = 0;
        let totalFilesWritten: number = 0;
        let totalProfilesParsed: number = 0;

        for (const ein in parsedProfiles) {
            const profile: TaxExemptOrganization = parsedProfiles[ein];
            totalProfilesParsed += 1;
            profile.dbId = generateId();
            profile.slug = `${slugify(profile.name, { lower: true })}-${ein.slice(-4)}`;
            if (meetsCriteria(profile)) {
                dbBatch.push(profile);
            } else {
                totalNotInserted += 1;
            }
            if (dbBatch.length >= BATCH_SIZE) {
                await insertManyTaxExemptOrgs(dbBatch);
                dbBatch = [];
                totalInserted += BATCH_SIZE;
            }
        }
        if (dbBatch.length > 0) {
            await insertManyTaxExemptOrgs(dbBatch);
            totalInserted += dbBatch.length;
            logger.info(`Inserted final batch of ${dbBatch.length} records to the database.`);
            dbBatch = [];
        }
        const outputDirectoryPath: string = path.join(__dirname, "../data/nonprofitProfiles");
        await jsonFileWrite(outputDirectoryPath, parsedProfiles, state);
        totalFilesWritten += 1;
        logger.info(`Processing for ${state} completed.`);
        logger.info(`- ${totalProfilesParsed} profile(s) parsed.`);
        logger.info(`- ${totalInserted} profile(s) inserted.`);
        logger.info(`- ${totalNotInserted} profile(s) selectively NOT inserted.`);
        logger.info(`- ${totalFilesWritten} file(s) written.`);
    } catch (error) {
        logger.error(`Error processing ${state} profiles.`, error);
    }
};

const main = async () => {
    const state = argv.state as string;
    if (state) {
        await createOrgsByState(state.toLowerCase());
    } else {
        logger.error("Please provide a state using --state");
        process.exit(1);
    }
};

main();
