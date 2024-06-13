import * as fs from "fs/promises";
import * as path from "path";

export const jsonFileWrite = async (directoryPath: string, content: object, fileName: string) => {
    try {
        await fs.access(directoryPath);
    } catch (error) {
        // If the directory does not exist, create it
        await fs.mkdir(directoryPath, { recursive: true });
    }
    const outputFilePath = path.join(directoryPath, `${fileName}.json`);
    const data = JSON.stringify(content);

    try {
        await fs.writeFile(outputFilePath, data);
        return outputFilePath;
    } catch (err) {
        console.error("error writing file", err);
        return "";
    }
};
