import generateId from "../utils/nanoid";
import { parseEoFile } from "../utils/parseEoFile";
import { ActivityCode, NonprofitProfile } from "../types";
import slugify from "slugify";
import * as path from "path";
import * as fs from "fs/promises";
import { testWriter } from "../utils/testWriter";

export const createProfilesByState = async (state: string) => {
    const fileName: string = "eo_" + state.toLowerCase() + ".csv";
    const parsedProfiles: NonprofitProfile[] = await parseEoFile(fileName);

    const mc: NonprofitProfile[] = [];
    const nmc: NonprofitProfile[] = [];
    parsedProfiles.forEach((profile: NonprofitProfile) => {
        if (meetsCriteria(profile)) {
            const id: string = generateId();
            profile.dbId = id;
            const slug: string = slugify(profile.name, {
                lower: true,
            });
            profile.slug = slug;
            mc.push(profile);
            // write file w. nanoID as name
            // create db entry

            // upload
        } else {
            nmc.push(profile);
            // write file with
            // upload to not-inserted folder
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

const writeProfileToFile = async (profile: NonprofitProfile, fileName: string, state: string): Promise<string> => {
    const outputDirectoryPath: string = path.join(__dirname, "../data/nonprofitProfiles", state);
    // Check if the directory exists
    try {
        await fs.access(outputDirectoryPath);
    } catch (error) {
        // If the directory does not exist, create it
        await fs.mkdir(outputDirectoryPath, { recursive: true });
    }
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
