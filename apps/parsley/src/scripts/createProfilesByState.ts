import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/parseEoFile";
import { jsonFileWrite } from "../utils/fileWrite";
import { ActivityCode, NonprofitProfile } from "../types";
import slugify from "slugify";
import * as path from "path";
import { TaxExemptOrganizationInsertType, closeClient, insertManyTaxExemptOrganization } from "../utils/supabaseDB";

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv)).argv;

const createProfilesByState = async (state: string) => {
    try {
        // parse the profiles from the eo file
        const fileName: string = "eo_" + state.toLowerCase() + ".csv";
        const parsedProfiles: Record<string, NonprofitProfile> = await parseEoFile(fileName);

        // create a batch so we don't insert profiles 1 by 1
        let dbBatch: TaxExemptOrganizationInsertType[] = [];
        const batchSize: number = 5000;

        // init some metrics for logging at the end
        let totalInserted: number = 0;
        let totalNotInserted: number = 0;
        let totalFilesWritten: number = 0;
        let totalProfilesParsed: number = 0;

        for (const ein in parsedProfiles) {
            const profile: NonprofitProfile = parsedProfiles[ein];
            totalProfilesParsed += 1;
            if (meetsCriteria(profile)) {
                profile.dbId = generateId();
                profile.slug = `${slugify(profile.name, { lower: true })}-${ein.slice(-4)}`;
                const teo: TaxExemptOrganizationInsertType = mapProfileToDbSchema(profile, profile.dbId, profile.slug);
                dbBatch.push(teo);
                if (dbBatch.length >= batchSize) {
                    await insertManyTaxExemptOrganization(dbBatch);
                    console.log(`Inserted batch of ${batchSize} records to the database.`);
                    dbBatch = [];
                    totalInserted += batchSize;
                }
            } else {
                totalNotInserted += 1;
            }
        }
        if (dbBatch.length > 0) {
            await insertManyTaxExemptOrganization(dbBatch);
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

const meetsCriteria = (profile: NonprofitProfile) => {
    const religiousActivities: ActivityCode[] | undefined = profile.activityCodes?.filter(
        (code) => code.category === "Religious Activities"
    );
    if (
        profile.deductibility?.code !== "1" || // Not deductible
        religiousActivities?.length !== 0 || // Religious activities
        profile.affiliation.code === "9" || // Subordinate
        profile.filingReqCode.code === "06" || // Not required to file (church)
        profile.filingReqCode.code === "13" || // Not required to file (religious organization)
        profile.filingReqCode.code === "14" || // Not required to file (instrumentalities of states or political subdivisions)
        profile.filingReqCode.code === "00" || // Not required to file (all other)
        profile.foundation.code === "02" || // Private operating foundation exempt from paying excise taxes
        profile.foundation.code === "03" || // Private operating foundation (other)
        profile.foundation.code === "04" || // Private non-operating foundation
        profile.foundation.code === "10" || // Church
        profile.status.code === "12" || // Trust
        profile.status.code === "25" // Terminating private foundation status
    ) {
        return false;
    }
    return true;
};

const mapProfileToDbSchema = (
    profile: NonprofitProfile,
    nanoId: string,
    slug: string
): TaxExemptOrganizationInsertType => {
    return {
        id: nanoId,
        slug: slug,
        ein: profile.ein,
        name: profile.name,
        inCareOfName: profile.ico,
        streetAddress: profile.street,
        city: profile.city,
        state: profile.state,
        createdAt: profile.createdAt ? new Date(profile.createdAt) : new Date(),
        lastUpdated: profile.lastUpdated ? new Date(profile.lastUpdated) : new Date(),
    };
};

const main = async () => {
    const state = argv.state as string;
    if (state) {
        await createProfilesByState(state.toLowerCase());
        await closeClient();
    } else {
        console.error("Please provide a state using --state");
        process.exit(1);
    }
};

main();
