import * as fs from "fs";
import { join } from "path";

import "dotenv/config";
import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { tax_exempt_orgs as taxExemptOrgs } from "./db/drizzle/schema";
import { eq } from "drizzle-orm";

type TaxEOSelect = typeof taxExemptOrgs.$inferSelect;
type Tax = typeof taxExemptOrgs.$inferInsert;
interface TaxEOInsert {
    ein: number;
    organization_name: string;
    in_care_of_name?: string;
    street_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    group_exemption_number?: number;
    subsection_code?: number;
    affiliation_code?: number;
    classification_code?: number;
    ruling_date?: Date | string;
    deductability?: "deductible by treaty" | "deductible" | "not deductible";
    foundation_code?: number;
    activity_code?: number;
    organization_type?: "co-operative" | "corporation" | "association" | "partnership" | "trust";
    exempt_organization_status_code?: number;
    tax_period?: Date | string;
    asset_code?: number;
    income_code?: number;
    income_amount?: number;
    revenue_amount?: number;
    filing_requirement_code?: number;
    pf_filing_requirement?: number;
    ntee_code?: string;
    sort_name?: string;
}

const config = {
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
};

const conn = connect(config);
const db = drizzle(conn);

function parseDateString(dateStr: string): Date | null {
    if (dateStr.length !== 6) {
        return null;
    }

    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10) - 1; // Months are 0-indexed in JavaScript

    if (isNaN(year) || isNaN(month)) {
        return null;
    }

    return new Date(year, month);
}

const insertEoFileIntoDb = async (fname: string) => {
    const currentPath = join(__dirname, "../data/needs_imported", fname);
    const destinationPath = join(__dirname, "../data/imported", fname);
    const keysFromFile = [
        "EIN",
        "NAME",
        "ICO",
        "STREET",
        "CITY",
        "STATE",
        "ZIP",
        "GROUP",
        "SUBSECTION",
        "AFFILIATION",
        "CLASSIFICATION",
        "RULING",
        "DEDUCTIBILITY",
        "FOUNDATION",
        "ACTIVITY",
        "ORGANIZATION",
        "STATUS",
        "TAX_PERIOD",
        "ASSET_CD",
        "INCOME_CD",
        "FILING_REQ_CD",
        "PF_FILING_REQ_CD",
        "ACCT_PD",
        "ASSET_AMT",
        "INCOME_AMT",
        "REVENUE_AMT",
        "NTEE_CD",
        "SORT_NAME",
    ];
    const keyMap = {
        EIN: "ein",
        NAME: "organization_name",
        ICO: "in_care_of_name",
        STREET: "street_address",
        CITY: "city",
        STATE: "state",
        ZIP: "zip_code",
        GROUP: "group_exemption_number",
        SUBSECTION: "subsection_code",
        AFFILIATION: "affiliation_code",
        CLASSIFICATION: "classification_code",
        RULING: "ruling_date",
        DEDUCTIBILITY: "deductability",
        FOUNDATION: "foundation_code",
        ACTIVITY: "activity_code",
        ORGANIZATION: "organization_type",
        STATUS: "exempt_organization_status_code",
        TAX_PERIOD: "tax_period",
        ASSET_CD: "asset_code",
        INCOME_CD: "income_code",
        FILING_REQ_CD: "filing_requirement_code",
        PF_FILING_REQ_CD: "pf_filing_requirement",
        ACCT_PD: "accounting_period",
        ASSET_AMT: "asset_amount",
        INCOME_AMT: "income_amount",
        REVENUE_AMT: "revenue_amount",
        NTEE_CD: "ntee_code",
        SORT_NAME: "sort_name",
    };

    try {
        const file = await fs.promises.open(currentPath, "r");
        let keys: Array<keyof TaxEOInsert> = [];
        for await (const line of file.readLines()) {
            const values = line.split(",");
            if (values[0] === "EIN") {
                continue;
            }

            const orgs: TaxEOSelect[] = await db
                .select()
                .from(taxExemptOrgs)
                .where(eq(taxExemptOrgs.ein, Number(values[0])));

            if (orgs.length === 0) {
                const parsedObject: { [key: string]: any } = {};

                for (let i = 0; i < keysFromFile.length; i++) {
                    const key = keysFromFile[i];
                    const value = values[i];

                    const dbKey = keyMap[key as keyof typeof keyMap];

                    if (!value) {
                        continue;
                    }

                    if (dbKey === "ruling_date" || dbKey === "tax_period") {
                        const parsedDate = parseDateString(value);
                        parsedObject[dbKey] = parsedDate;
                    } else if (dbKey === "activity_code") {
                        const activities = value.match(/.{1,3}/g) || [];
                        activities.forEach((activity, index) => {
                            if (activity !== "000") {
                                parsedObject[`activity_code_${index + 1}`] = parseInt(activity, 10);
                            }
                        });
                    } else if (dbKey === "ntee_code") {
                        parsedObject[dbKey] = value.substring(0, 3);
                    } else {
                        const isNumeric = !isNaN(parseFloat(value)) && isFinite(+value);
                        parsedObject[dbKey] = isNumeric ? parseInt(value, 10) : value;
                    }
                }

                await db.insert(taxExemptOrgs).values(parsedObject as any);
            } else {
                console.log(`EIN: ${values[0]} ALREADY EXISTS IN DB`);
            }
        }
        console.log(`FINISHED INSERTING ALL NEW RECORDS FROM: ${fname}`);

        fs.rename(currentPath, destinationPath, function (err) {
            if (err) {
                throw err;
            } else {
                console.log(`MOVED FILE TO: ${destinationPath}`);
            }
        });
    } catch (err) {
        console.log(`COULD NOT INSERT FILE BECAUSE OF ERROR:\n${err}`);
    }
};

insertEoFileIntoDb("eo_ca.csv");
