import "dotenv/config";
import { parseEoFile } from "./utils/parseEoFile";
import { NonprofitProfile } from "./types";
import path from "path";
import { jsonFileWrite } from "./utils/fileWrite";

const main = async () => {
    const profiles: Record<string, NonprofitProfile> = await parseEoFile("eo_ca.csv");
    // console.log(Object.keys(profiles).length);
    const outputDirectoryPath: string = path.join(__dirname, "/data/nonprofitProfiles");
    // const out: string = JSON.stringify(profiles);
    await jsonFileWrite(outputDirectoryPath, profiles, "Test");
};

main().catch(console.error);
