import {
    mysqlTable,
    mysqlSchema,
    AnyMySqlColumn,
    primaryKey,
    unique,
    int,
    char,
    varchar,
    index,
    smallint,
    tinyint,
    date,
    bigint,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const ntee_codes = mysqlTable(
    "ntee_code",
    {
        code: char("code", { length: 3 }).notNull().primaryKey(),
        category: varchar("category", { length: 150 }).notNull(),
        description: varchar("description", { length: 1000 }),
        major_code: char("major_code", { length: 1 }).notNull(),
    },
    (table) => {
        return {
            major_code_idx: index("major_code_idx").on(table.major_code),
        };
    }
);

export const ntee_major_codes = mysqlTable("ntee_major_code", {
    code: char("code", { length: 1 }).notNull().primaryKey(),
    category: varchar("category", { length: 150 }).notNull(),
    description: varchar("description", { length: 1000 }),
});

export const tax_exempt_orgs = mysqlTable(
    "tax_exempt_orgs",
    {
        organization_id: bigint("organization_id", { mode: "bigint" }).autoincrement().notNull().primaryKey(), // not added from file; gets generated on new insert
        ein: int("ein").notNull(),
        organization_name: varchar("organization_name", { length: 255 }).notNull(),
        in_care_of_name: varchar("in_care_of_name", { length: 500 }),
        street_address: varchar("street_address", { length: 500 }),
        city: varchar("city", { length: 255 }),
        state: varchar("state", { length: 100 }),
        zip_code: varchar("zip_code", { length: 12 }),
        group_exemption_number: smallint("group_exemption_number"),
        subsection_code: tinyint("subsection_code"),
        affiliation_code: tinyint("affiliation_code"),
        classification_code: int("classification_code"),
        ruling_date: date("ruling_date", { mode: "date" }),
        deductability: varchar("deductability", {
            length: 20,
            enum: ["deductible by treaty", "deductible", "not deductible"],
        }),
        foundation_code: tinyint("foundation_code"),
        activity_code_1: smallint("activity_code_1"), // activity code in file can be broken into 3, 3 digit activity codes; 00 should mean null
        activity_code_2: smallint("activity_code_2"),
        activity_code_3: smallint("activity_code_3"),
        organization_type: varchar("organization_type", {
            length: 12,
            enum: ["co-operative", "corporation", "association", "partnership", "trust"],
        }),
        exempt_organization_status: varchar("exempt_organization_status", {
            length: 100,
            enum: [
                "Unconditional Exemption",
                "Conditional Exemption",
                "Trust described in section 4947(a)(2) of the IR Code",
                "Organization terminating its private foundation status under section 507(b)(1)(B) of the Code",
            ],
        }),
        tax_period: date("tax_period", { mode: "date" }),
        asset_amount_range: varchar("asset_amount_range", {
            length: 25,
            enum: [
                "0",
                "1,9999",
                "10000,24999",
                "25000,99999",
                "100000,499999",
                "500000,999999",
                "1000000,4999999",
                "5000000,9999999",
                "10000000,49999999",
                "50000000",
            ],
        }),
        income_amount_range: varchar("income_amount_range", {
            length: 25,
            enum: [
                "0",
                "1,9999",
                "10000,24999",
                "25000,99999",
                "100000,499999",
                "500000,999999",
                "1000000,4999999",
                "5000000,9999999",
                "10000000,49999999",
                "50000000",
            ],
        }),
        income_amount: int("income_amount"),
        revenue_amount: int("revenue_amount"),
        filing_requirement_code: tinyint("filing_requirement_code"),
        pf_filing_requirement: tinyint("pf_filing_requirement"),
        ntee_code: char("ntee_code", { length: 3 }),
        sort_name: varchar("sort_name", { length: 100 }),
        accounting_period: tinyint("accounting_period"), // at most a 2 digit value that represents the month of the year
        asset_amount: int("asset_amount"),
    },
    (table) => {
        return {
            ntee_code_idx: index("ntee_code_idx").on(table.ntee_code),
            ein_idx: index("ein_idx").on(table.ein),
        };
    }
);

// export const income_asset_codes = mysqlTable("income_asset_code", {
//     code: tinyint("code").primaryKey(),
//     low_range: int("low_range"),
//     high_range: int("high_range"),
// });

export const subsection_classification_codes = mysqlTable(
    "subsection_classification_codes",
    {
        subsection_code: tinyint("subsection_code").notNull(),
        classification_code: tinyint("classification_code").notNull(),
        description: varchar("description", { length: 100 }),
    },
    (table) => {
        return { pk: primaryKey(table.subsection_code, table.classification_code) };
    }
);

// NEEDED FOR V2
// 11. filing req code
// 6. foundation code
// 3. affiliation code

// TABLES NOT NEEDED NOW - maybe future
// 1. group exemption number
// 7. activity code
