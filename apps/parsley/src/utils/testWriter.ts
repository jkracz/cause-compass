import * as fs from "fs";
import * as path from "path";

export const testWriter = async (content: object | object[], fileName: string) => {
    const outputPath = path.join(__dirname, fileName);
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
