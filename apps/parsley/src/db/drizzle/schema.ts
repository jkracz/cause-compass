import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, tinyint, int, index, char, varchar, bigint, smallint, date } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"


export const income_and_asset_code = mysqlTable("income_and_asset_code", {
	code: tinyint("code").notNull(),
	low_range: int("low_range"),
	high_range: int("high_range"),
},
(table) => {
	return {
		income_and_asset_code_code: primaryKey(table.code),
	}
});

export const ntee_code = mysqlTable("ntee_code", {
	code: char("code", { length: 3 }).notNull(),
	category: varchar("category", { length: 150 }).notNull(),
	description: varchar("description", { length: 1000 }),
	major_code: char("major_code", { length: 1 }).notNull(),
},
(table) => {
	return {
		major_code_idx: index("major_code_idx").on(table.major_code),
		ntee_code_code: primaryKey(table.code),
	}
});

export const ntee_major_code = mysqlTable("ntee_major_code", {
	code: char("code", { length: 1 }).notNull(),
	category: varchar("category", { length: 150 }).notNull(),
	description: varchar("description", { length: 1000 }),
},
(table) => {
	return {
		ntee_major_code_code: primaryKey(table.code),
	}
});

export const tax_exempt_orgs = mysqlTable("tax_exempt_orgs", {
	organization_id: bigint("organization_id", { mode: "number" }).autoincrement().notNull(),
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
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ruling_date: date("ruling_date", { mode: 'string' }),
	deductability: varchar("deductability", { length: 20 }),
	foundation_code: tinyint("foundation_code"),
	activity_code_1: smallint("activity_code_1"),
	organization_type: varchar("organization_type", { length: 12 }),
	exempt_organization_status_code: tinyint("exempt_organization_status_code"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	tax_period: date("tax_period", { mode: 'string' }),
	asset_code: tinyint("asset_code"),
	income_code: tinyint("income_code"),
	income_amount: int("income_amount"),
	revenue_amount: int("revenue_amount"),
	filing_requirement_code: tinyint("filing_requirement_code"),
	pf_filing_requirement: tinyint("pf_filing_requirement"),
	ntee_code: char("ntee_code", { length: 3 }),
	sort_name: varchar("sort_name", { length: 100 }),
	activity_code_2: smallint("activity_code_2"),
	activity_code_3: smallint("activity_code_3"),
	accounting_period: tinyint("accounting_period"),
	asset_amount: int("asset_amount"),
},
(table) => {
	return {
		asset_code_idx: index("asset_code_idx").on(table.asset_code),
		ein_idx: index("ein_idx").on(table.ein),
		income_code_idx: index("income_code_idx").on(table.income_code),
		ntee_code_idx: index("ntee_code_idx").on(table.ntee_code),
		tax_exempt_orgs_organization_id: primaryKey(table.organization_id),
	}
});