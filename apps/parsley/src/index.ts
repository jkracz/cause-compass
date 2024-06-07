import "dotenv/config";
import { parseEoFile } from "./utils/parseEoFile";
import { generalSearch } from "./utils/googleSearch";
import { uploadJsonToSupabase } from "./utils/supabaseStorage";
import * as fs from "fs";
import * as path from "path";
import { createProfilesByState } from "./scripts/createProfilesByState";

const main = async () => {
    // generalSearch("DUO DUO ANIMAL WELFARE PROJECT INC SUNNYVALE CA")
    //     .then((results) => {
    //         console.log(results);
    //         writeProfile(results);
    //     })
    //     .catch(console.error);
    // const profiles = await parseEoFile("eo_ca.csv");
    // await insertManyNonprofits(profiles, "causecompass", "nonprofits");
    // const currentPath = path.join(__dirname, "/data/nonprofitProfiles/al", "010520599.json");
    // uploadJsonToSupabase(currentPath, "nonprofit_profile_files/parsed", "al/010520599.json");
    createProfilesByState("ca");
};

const writeSearchResults = async (content: object) => {
    const outputPath = path.join(__dirname, "searchOutput.json");
    const data = JSON.stringify(content, null, 4);

    // Asynchronously write the file
    fs.writeFile(outputPath, data, (err) => {
        if (err) {
            console.error("Error writing file:", err);
        } else {
            return outputPath;
        }
    });
};

main();
