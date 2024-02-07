import * as fs from "fs";
import { parse } from "csv-parse";
import { join } from "path";

import { NonprofitProfile } from "../types";

export const parseEoFile = async (fileName: string): Promise<NonprofitProfile[]> => {
    const currentPath = join(__dirname, "../data/raw", fileName);

    return new Promise((resolve, reject) => {
        const profiles: NonprofitProfile[] = [];
        const parser = parse({ columns: true, delimiter: "," });
        const readableStream = fs.createReadStream(currentPath);

        // Pipe the readable stream to the parser
        readableStream
            .pipe(parser)
            .on("data", (row) => {
                const npProfile = transformCsvRowToNonprofitProfile(row);
                profiles.push(npProfile);
            })
            .on("error", (err) => {
                console.error(err);
                reject(err);
            })
            .on("end", () => {
                console.log("Finished parsing the CSV file.");
                resolve(profiles);
            });
    });
};

// part of old filesystem process; before mongodb
const writeProfile = async (outputDirectoryPath: string, profile: NonprofitProfile) => {
    if (!fs.existsSync(outputDirectoryPath)) {
        fs.mkdirSync(outputDirectoryPath, { recursive: true });
    }
    const profileFilePath = join(outputDirectoryPath, `${profile.ein}.json`);
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
    const filePath = join(folderPath, fileName);
    return fs.existsSync(filePath);
};

const transformCsvRowToNonprofitProfile = (row: any): NonprofitProfile => {
    return {
        ein: row.EIN,
        name: row.NAME,
        ico: row.ICO.split("% ")[1],
        street: row.STREET,
        city: row.CITY,
        state: row.STATE,
        zip: row.ZIP,
        group: row.GROUP,
        subsection: row.SUBSECTION,
        affiliation: row.AFFILIATION,
        classification: row.CLASSIFICATION,
        ruling: row.RULING,
        deductibility: row.DEDUCTIBILITY,
        foundation: row.FOUNDATION,
        activity: row.ACTIVITY,
        organization: row.ORGANIZATION,
        status: row.STATUS,
        taxPeriod: row.TAX_PERIOD,
        assetCode: row.ASSET_CD,
        incomeCode: row.INCOME_CD,
        filingReqCode: row.FILING_REQ_CD,
        pfFilingReqCode: row.PF_FILING_REQ_CD,
        acctPeriod: row.ACCT_PD,
        assetAmt: row.ASSET_AMT ? parseFloat(row.ASSET_AMT) : undefined,
        incomeAmt: row.INCOME_AMT ? parseFloat(row.INCOME_AMT) : undefined,
        revenueAmt: row.REVENUE_AMT ? parseFloat(row.REVENUE_AMT) : undefined,
        nteeCode: row.NTEE_CD,
        sortName: row.SORT_NAME,
        createdAt: new Date().toISOString(), // Current timestamp
        lastUpdatedAt: undefined, // Current timestamp as placeholder
    };
};
