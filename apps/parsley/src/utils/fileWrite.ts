import * as fs from "fs";
import * as path from "path";
import { NonprofitProfile } from "../types";

const writeProfile = async (outputDirectoryPath: string, profile: NonprofitProfile) => {
    if (!fs.existsSync(outputDirectoryPath)) {
        fs.mkdirSync(outputDirectoryPath, { recursive: true });
    }
    const profileFilePath = path.join(outputDirectoryPath, `${profile.ein}.json`);
    const data = JSON.stringify(profile, null, 4);

    // Asynchronously write the file
    fs.writeFile(profileFilePath, data, (err) => {
        if (err) {
            console.error("Error writing file:", err);
        } else {
            return profileFilePath;
        }
    });
};

const checkFileExists = (folderPath: string, fileName: string): boolean => {
    const filePath = path.join(folderPath, fileName);
    return fs.existsSync(filePath);
};
