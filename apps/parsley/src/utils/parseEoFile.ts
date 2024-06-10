import * as fs from "fs";
import { parse } from "csv-parse";
import { join } from "path";
import { testWriter } from "./testWriter";

import {
    NonprofitProfile,
    NteeCode,
    ActivityCode,
    AssetCode,
    AffiliationCode,
    DeductibilityCode,
    OrgCode,
    FoundationCode,
    FilingRequirementCode,
    EOStatusCode,
} from "../types";

// importing the data dictionaries
import * as activityCodes from "../data/dataDictionaries/ActivityCodes.json";
import * as affiliationCodes from "../data/dataDictionaries/AffiliationCodes.json";
import * as assetCodes from "../data/dataDictionaries/AssetCodes.json";
import * as deductibilityCodes from "../data/dataDictionaries/DeductibilityCodes.json";
import * as filingReqCodes from "../data/dataDictionaries/FilingRequirementCodes.json";
import * as foundationCodes from "../data/dataDictionaries/FoundationCodes.json";
import * as nteeCodes from "../data/dataDictionaries/Ntee.json";
import * as orgTypes from "../data/dataDictionaries/OrganizationTypes.json";
import * as pfFilingReqCodes from "../data/dataDictionaries/PFFilingRequirementCodes.json";
import * as eoStatusCodes from "../data/dataDictionaries/EOStatusCodes.json";

// Cast imported JSON objects to their respective types
const activityCodesDict = activityCodes as Record<string, ActivityCode>;
const affiliationCodesDict = affiliationCodes as Record<string, AffiliationCode>;
const assetCodesDict = assetCodes as Record<string, AssetCode>;
const deductibilityCodesDict = deductibilityCodes as Record<string, DeductibilityCode>;
const filingReqCodesDict = filingReqCodes as Record<string, FilingRequirementCode>;
const foundationCodesDict = foundationCodes as Record<string, FoundationCode>;
const nteeCodesDict = nteeCodes as Record<string, NteeCode>;
const orgTypesDict = orgTypes as Record<string, OrgCode>;
const pfFilingReqCodesDict = pfFilingReqCodes as Record<string, FilingRequirementCode>;
const eoStatusCodesDict = eoStatusCodes as Record<string, EOStatusCode>;

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
        affiliation: affiliationCodesDict[row.AFFILIATION],
        classification: row.CLASSIFICATION,
        ruling: row.RULING,
        deductibility: deductibilityCodesDict[row.DEDUCTIBILITY],
        foundation: foundationCodesDict[row.FOUNDATION],
        activityCodes: parseActivityCodes(row.ACTIVITY),
        organization: orgTypesDict[row.ORGANIZATION],
        status: eoStatusCodesDict[row.STATUS],
        taxPeriod: row.TAX_PERIOD,
        assetCode: assetCodesDict[row.ASSET_CD],
        incomeCode: row.INCOME_CD,
        filingReqCode: filingReqCodesDict[row.FILING_REQ_CD],
        pfFilingReqCode: pfFilingReqCodesDict[row.PF_FILING_REQ_CD],
        acctPeriod: row.ACCT_PD,
        assetAmt: row.ASSET_AMT ? parseFloat(row.ASSET_AMT) : undefined,
        incomeAmt: row.INCOME_AMT ? parseFloat(row.INCOME_AMT) : undefined,
        revenueAmt: row.REVENUE_AMT ? parseFloat(row.REVENUE_AMT) : undefined,
        nteeCode: nteeCodesDict[row.NTEE_CD],
        sortName: row.SORT_NAME,
        createdAt: new Date().toISOString(), // Current timestamp
        lastUpdated: new Date().toISOString(),
    };
};

const parseActivityCodes = (code: string): ActivityCode[] => {
    if (code === "000000000") return [];

    const codes: ActivityCode[] = [];
    const ac1: string = code.slice(0, 3);
    const ac2: string = code.slice(3, 6);
    const ac3: string = code.slice(6);
    if (ac1 !== "000" && activityCodesDict[ac1] !== undefined) {
        codes.push(activityCodesDict[ac1]);
    }
    if (ac2 !== "000" && activityCodesDict[ac2] !== undefined) {
        codes.push(activityCodesDict[ac2]);
    }
    if (ac3 !== "000" && activityCodesDict[ac3] !== undefined) {
        codes.push(activityCodesDict[ac3]);
    }
    return codes;
};
