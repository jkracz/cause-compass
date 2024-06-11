import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/parseEoFile";
import { ActivityCode, NonprofitProfile } from "../types";
import slugify from "slugify";
import * as path from "path";
import * as fs from "fs/promises";
import { uploadJsonToSupabase } from "../utils/supabaseStorage";
import { insertOneTaxExemptOrganization, TaxExemptOrganizationInsertType, closeClient } from "../utils/supabaseDB";

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const argv = yargs(hideBin(process.argv)).argv;

const createProfilesByState = async (state: string) => {
    const fileName: string = "eo_" + state.toLowerCase() + ".csv";
    const parsedProfiles: NonprofitProfile[] = await parseEoFile(fileName);

    for (const profile of parsedProfiles) {
        if (meetsCriteria(profile)) {
            const id: string = generateId();
            profile.dbId = id;
            const slug: string = slugify(profile.name, {
                lower: true,
            });
            profile.slug = slug;
            const outputPath: string = await writeProfileToFile(profile, profile.dbId, state, true);
            await uploadJsonToSupabase(outputPath, `eo_profiles/${state}`, profile.dbId + ".json");
            const teo: TaxExemptOrganizationInsertType = mapProfileToDbSchema(profile, id, slug);
            await insertOneTaxExemptOrganization(teo);
        } else {
            const outputPath: string = await writeProfileToFile(profile, profile.ein, state, false);
            await uploadJsonToSupabase(outputPath, `eo_profiles/${state}/not-inserted`, profile.ein + ".json");
        }
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

const writeProfileToFile = async (
    profile: NonprofitProfile,
    id: string,
    state: string,
    insert: boolean
): Promise<string> => {
    let outputDirectoryPath: string = path.join(__dirname, "../data/nonprofitProfiles", state);
    if (!insert) {
        outputDirectoryPath = path.join(outputDirectoryPath, "/not-inserted");
    }
    // Check if the directory exists
    try {
        await fs.access(outputDirectoryPath);
    } catch (error) {
        // If the directory does not exist, create it
        await fs.mkdir(outputDirectoryPath, { recursive: true });
    }
    const fileName = id + ".json";
    const outputFilePath: string = path.join(outputDirectoryPath, fileName);
    const data = JSON.stringify(profile, null, 4);
    try {
        await fs.writeFile(outputFilePath, data);
        return outputFilePath;
    } catch (err) {
        console.error("error writing file", err);
        return "";
    }
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
