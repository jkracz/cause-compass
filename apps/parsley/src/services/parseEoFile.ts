import * as fs from "fs";
import { parse } from "csv-parse";
import { join } from "path";
import { convertToTitleCase } from "../utils/titleCase";
import { logger } from "@/utils/logger";

import {
  type ActivityCode,
  type AffiliationCode,
  type AssetCode,
  type DeductibilityCode,
  type EOStatusCode,
  type EoFileRow,
  type FilingRequirementCode,
  type FoundationCode,
  type NteeCode,
  type OrgCode,
  type TaxExemptOrganization,
} from "@cause/lib";

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
const affiliationCodesDict = affiliationCodes as Record<
  string,
  AffiliationCode
>;
const assetCodesDict = assetCodes as Record<string, AssetCode>;
const deductibilityCodesDict = deductibilityCodes as Record<
  string,
  DeductibilityCode
>;
const filingReqCodesDict = filingReqCodes as Record<
  string,
  FilingRequirementCode
>;
const foundationCodesDict = foundationCodes as Record<string, FoundationCode>;
const nteeCodesDict = nteeCodes as Record<string, NteeCode>;
const orgTypesDict = orgTypes as Record<string, OrgCode>;
const pfFilingReqCodesDict = pfFilingReqCodes as Record<
  string,
  FilingRequirementCode
>;
const eoStatusCodesDict = eoStatusCodes as Record<string, EOStatusCode>;

/**
 * Parses a CSV file containing information about tax-exempt organizations
 * and transforms each row into a TaxExemptOrganization object.
 *
 * This function reads the specified CSV file, processes each row, and
 * constructs a record of TaxExemptOrganization objects indexed by their EIN.
 * It utilizes a CSV parser to handle the input data and applies necessary
 * transformations to the fields, such as converting names to title case.
 *
 * @param {string} fileName - The name of the CSV file to be parsed.
 * @returns {Promise<Record<string, TaxExemptOrganization>>} A promise that resolves
 *          to a record of TaxExemptOrganization objects, where the keys are the EINs.
 * @throws {Error} Throws an error if the file cannot be read or parsed.
 */

const DATA_DIR = "data";
export const parseEoFile = async (
  fileName: string,
): Promise<Record<string, TaxExemptOrganization>> => {
  const currentPath = join(process.cwd(), `${DATA_DIR}/raw`, fileName);

  return new Promise((resolve, reject) => {
    const profiles: Record<string, TaxExemptOrganization> = {};
    const parser = parse({ columns: true, delimiter: "," });
    const readableStream = fs.createReadStream(currentPath);

    // Pipe the readable stream to the parser
    readableStream
      .pipe(parser)
      .on("data", (row) => {
        const npProfile = transformCsvRowToNonprofitProfile(row);
        profiles[npProfile.ein] = npProfile;
      })
      .on("error", (err) => {
        logger.error(err);
        reject(err);
      })
      .on("end", () => {
        logger.info("Finished parsing the CSV file.");
        resolve(profiles);
      });
  });
};

const transformCsvRowToNonprofitProfile = (
  row: EoFileRow,
): TaxExemptOrganization => {
  return {
    dbId: row.EIN, // Use EIN as initial dbId, will be replaced when stored in database
    ein: row.EIN,
    name: convertToTitleCase(row.NAME),
    ico: (() => {
      const icoPart = row.ICO.split("% ")[1];
      return icoPart ? convertToTitleCase(icoPart) : undefined;
    })(),
    street: convertToTitleCase(row.STREET),
    city: convertToTitleCase(row.CITY),
    state: row.STATE,
    zip: row.ZIP,
    group: row.GROUP,
    subsection: row.SUBSECTION,
    affiliation: affiliationCodesDict[row.AFFILIATION] ?? {
      code: row.AFFILIATION,
      code_name: "Unknown",
      description: "Unknown",
    },
    classification: row.CLASSIFICATION,
    ruling: row.RULING,
    deductibility: deductibilityCodesDict[row.DEDUCTIBILITY],
    foundation: foundationCodesDict[row.FOUNDATION],
    activityCodes: parseActivityCodes(row.ACTIVITY),
    organization: orgTypesDict[row.ORGANIZATION],
    status: eoStatusCodesDict[row.STATUS] ?? {
      code: row.STATUS,
      description: "Unknown",
    },
    taxPeriod: row.TAX_PERIOD,
    assetCode: assetCodesDict[row.ASSET_CD] ?? {
      code: row.ASSET_CD,
      lowerLimit: 0,
    },
    incomeCode: row.INCOME_CD,
    filingReqCode: filingReqCodesDict[row.FILING_REQ_CD] ?? {
      code: row.FILING_REQ_CD,
      description: "Unknown",
      form_number: "",
    },
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
