import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/parseEoFile";
import { jsonFileWrite } from "../utils/fileWrite";
import { NonprofitProfile } from "../types";
import slugify from "slugify";
import * as path from "path";
import { insertManyTaxExemptOrgs } from "../utils/mongo";

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv)).argv;

const createProfilesByState = async (state: string) => {
    try {
        // parse the profiles from the eo file
        const fileName: string = "eo_" + state.toLowerCase() + ".csv";
        const parsedProfiles: Record<string, NonprofitProfile> = await parseEoFile(fileName);

        // create a batch so we don't insert profiles 1 by 1
        let dbBatch: NonprofitProfile[] = [];
        const batchSize: number = 5000;

        // init some metrics for logging at the end
        let totalInserted: number = 0;
        let totalNotInserted: number = 0;
        let totalFilesWritten: number = 0;
        let totalProfilesParsed: number = 0;

        for (const ein in parsedProfiles) {
            const profile: NonprofitProfile = parsedProfiles[ein];
            totalProfilesParsed += 1;
            profile.dbId = generateId();
            profile.slug = `${slugify(profile.name, { lower: true })}-${ein.slice(-4)}`;
            dbBatch.push(profile);
            if (dbBatch.length >= batchSize) {
                await insertManyTaxExemptOrgs(dbBatch);
                dbBatch = [];
                totalInserted += batchSize;
            }
        }
        if (dbBatch.length > 0) {
            await insertManyTaxExemptOrgs(dbBatch);
            totalInserted += dbBatch.length;
            console.log(`Inserted final batch of ${dbBatch.length} records to the database.`);
            dbBatch = [];
        }
        const outputDirectoryPath: string = path.join(__dirname, "../data/nonprofitProfiles");
        await jsonFileWrite(outputDirectoryPath, parsedProfiles, state);
        totalFilesWritten += 1;
        console.log("----------------------------");
        console.log(`Processing for ${state} completed.`);
        console.log(`- ${totalProfilesParsed} profile(s) parsed.`);
        console.log(`- ${totalInserted} profile(s) inserted.`);
        console.log(`- ${totalNotInserted} profile(s) selectively NOT inserted.`);
        console.log(`- ${totalFilesWritten} file(s) written.`);
    } catch (error) {
        console.error(`Error processing ${state} profiles.`, error);
    }
};

const main = async () => {
    const state = argv.state as string;
    if (state) {
        await createProfilesByState(state.toLowerCase());
    } else {
        console.error("Please provide a state using --state");
        process.exit(1);
    }
};

main();
