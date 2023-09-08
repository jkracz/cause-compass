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

export const ntee_code = mysqlTable(
    "ntee_code",
    {
        code: char("code", { length: 3 }).notNull(),
        category: varchar("category", { length: 150 }).notNull(),
        description: varchar("description", { length: 1000 }),
        major_code: char("major_code", { length: 1 }).notNull(),
    },
    (table) => {
        return {
            codeId: primaryKey(table.code),
            major_code_idx: index("major_code_idx").on(table.major_code),
        };
    }
);

export const ntee_major_code = mysqlTable(
    "ntee_major_code",
    {
        code: char("code", { length: 1 }).notNull(),
        category: varchar("category", { length: 150 }).notNull(),
        description: varchar("description", { length: 1000 }),
    },
    (table) => {
        return {
            codeId: primaryKey(table.code),
        };
    }
);

export const tax_exempt_orgs = mysqlTable(
    "tax_exempt_orgs",
    {
        organization_id: bigint("organization_id", { mode: "bigint" }).autoincrement().notNull(), // not added from file; gets generated on new insert
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
        exempt_organization_status_code: tinyint("exempt_organization_status_code"),
        tax_period: date("tax_period", { mode: "date" }),
        asset_code: tinyint("asset_code"),
        income_code: tinyint("income_code"),
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
            organization_id: primaryKey(table.organization_id),
            ntee_code_idx: index("ntee_code_idx").on(table.ntee_code),
            ein_idx: index("ein_idx").on(table.ein),
            asset_code_idx: index("asset_code_idx").on(table.asset_code),
            income_code_idx: index("income_code_idx").on(table.income_code),
        };
    }
);

export const income_and_asset_code = mysqlTable(
    "income_and_asset_code",
    {
        code: tinyint("code"),
        low_range: int("low_range"),
        high_range: int("high_range"),
    },
    (table) => {
        return { code: primaryKey(table.code) };
    }
);

// NEEDED FOR V1
// 13. ntee code
// major ntee code
// 9. income & asset code

// NEEDED FOR V2
// 11. filing req code
// 6. foundation code
// 3. affiliation code

// TABLES NOT NEEDED NOW - maybe future
// 4. classification code
// 1. group exemption number
// 2. subsection code
// 7. activity code
// 5. deductability code
// 8. org code
