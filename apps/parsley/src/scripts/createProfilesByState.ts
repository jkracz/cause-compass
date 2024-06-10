import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/parseEoFile";
import { ActivityCode, NonprofitProfile } from "../types";
import slugify from "slugify";
import * as path from "path";
import * as fs from "fs/promises";
import { uploadJsonToSupabase } from "../utils/supabaseStorage";
import { insertOneTaxExemptOrganization, TaxExemptOrganizationInsertType } from "../utils/supabaseDB";

export const createProfilesByState = async (state: string) => {
    const fileName: string = "eo_" + state.toLowerCase() + ".csv";
    const parsedProfiles: NonprofitProfile[] = await parseEoFile(fileName);

    parsedProfiles.forEach(async (profile: NonprofitProfile) => {
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
    });
};

const meetsCriteria = (profile: NonprofitProfile) => {
    const religiousActivities: ActivityCode[] | undefined = profile.activityCodes?.filter(
        (code) => code.category === "Religious Activities"
    );
    if (profile.foundation.code === "10" || profile.deductibility?.code !== "1" || religiousActivities?.length !== 0) {
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
