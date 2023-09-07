import * as fs from "fs";
import { join } from "path";

import "dotenv/config";
import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { taxExemptOrgs } from "./db/drizzle/schema";
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

const insertEoFileIntoDb = async (fname: string) => {
    const currentPath = join(__dirname, "../data/needs_imported", fname);
    const destinationPath = join(__dirname, "../data/imported", fname);
    try {
        const file = await fs.promises.open(currentPath, "r");
        let keys: Array<keyof TaxEOInsert> = [];
        for await (const line of file.readLines()) {
            const lineSplit = line.split(",");
            if (lineSplit[0] === "EIN") {
                keys = lineSplit as Array<keyof TaxEOInsert>;
                continue;
            }

            const orgs: TaxEOSelect[] = await db
                .select()
                .from(taxExemptOrgs)
                .where(eq(taxExemptOrgs.ein, Number(lineSplit[0])));

            if (orgs.length === 0) {
                const obj: TaxEOInsert = keys.reduce<TaxEOInsert>((acc, key, index) => {
                    const value = lineSplit[index];
                    switch (key) {
                        case "ein":
                        case "group_exemption_number":
                        case "subsection_code":
                        case "affiliation_code":
                        case "classification_code":
                        case "foundation_code":
                        case "activity_code":
                        case "exempt_organization_status_code":
                        case "asset_code":
                        case "income_code":
                        case "income_amount":
                        case "revenue_amount":
                        case "filing_requirement_code":
                        case "pf_filing_requirement":
                            acc[key] = parseInt(value, 10);
                            break;
                        case "ruling_date":
                        case "tax_period":
                            acc[key] = new Date(value); // or just `value` if string is fine
                            break;
                        default:
                            acc[key] = value as never;
                            break;
                    }
                    return acc;
                }, {} as TaxEOInsert);
                console.log(obj);
                await db.insert(taxExemptOrgs).values(obj);
            } else {
                console.log("ELSE");
            }
            break;

            // if (lineSplit[0].length === 1) {
            //     const majorNtee: MajorNteeCode[] = await db
            //         .select()
            //         .from(nteeMajorCode)
            //         .where(eq(nteeMajorCode.code, lineSplit[0]));
            //     if (majorNtee.length == 0) {
            //         await db
            //             .insert(nteeMajorCode)
            //             .values({ code: lineSplit[0], category: lineSplit[1], description: lineSplit[2] });
            //     }
            // } else {
            //     const ntee: NteeCode[] = await db.select().from(nteeCode).where(eq(nteeCode.code, lineSplit[0]));
            //     if (ntee.length === 0) {
            //         await db.insert(nteeCode).values({
            //             code: lineSplit[0],
            //             category: lineSplit[1],
            //             description: lineSplit[2],
            //             majorCode: lineSplit[0][0],
            //         });
            //     }
            // }
        }
        // console.log(`FINISHED INSERTING ALL NEW RECORDS FROM: ${fname}`);

        // fs.rename(currentPath, destinationPath, function (err) {
        //     if (err) {
        //         throw err;
        //     } else {
        //         console.log(`MOVED FILE TO: ${destinationPath}`);
        //     }
        // });
    } catch (err) {
        console.log(`COULD NOT INSERT FILE BECAUSE OF ERROR:\n${err}`);
    }
};

insertEoFileIntoDb("eo_ca.csv");
