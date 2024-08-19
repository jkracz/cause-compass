import * as fs from "fs/promises";
import * as path from "path";

/**
 * Writes a JSON file to the specified directory.
 *
 * This function checks if the directory exists, and if not, it creates the directory
 * recursively. It then writes the provided content to a file with the specified name
 * in JSON format.
 *
 * @param {string} directoryPath - The path to the directory where the file will be written.
 * @param {object} content - The content to be written to the JSON file.
 * @param {string} fileName - The name of the file (without the .json extension) to be created.
 * @returns {Promise<string>} A promise that resolves to the path of the written file, or an empty string if an error occurs.
 */

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
