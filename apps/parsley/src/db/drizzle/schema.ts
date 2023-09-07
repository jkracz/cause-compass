import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, tinyint, int, index, char, varchar, bigint, smallint, date } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"


export const incomeAndAssetCode = mysqlTable("income_and_asset_code", {
	code: tinyint("code").notNull(),
	lowRange: int("low_range"),
	highRange: int("high_range"),
},
(table) => {
	return {
		incomeAndAssetCodeCode: primaryKey(table.code),
	}
});

export const nteeCode = mysqlTable("ntee_code", {
	code: char("code", { length: 3 }).notNull(),
	category: varchar("category", { length: 150 }).notNull(),
	description: varchar("description", { length: 1000 }),
	majorCode: char("major_code", { length: 1 }).notNull(),
},
(table) => {
	return {
		majorCodeIdx: index("major_code_idx").on(table.majorCode),
		nteeCodeCode: primaryKey(table.code),
	}
});

export const nteeMajorCode = mysqlTable("ntee_major_code", {
	code: char("code", { length: 1 }).notNull(),
	category: varchar("category", { length: 150 }).notNull(),
	description: varchar("description", { length: 1000 }),
},
(table) => {
	return {
		nteeMajorCodeCode: primaryKey(table.code),
	}
});

export const taxExemptOrgs = mysqlTable("tax_exempt_orgs", {
	organizationId: bigint("organization_id", { mode: "number" }).autoincrement().notNull(),
	ein: int("ein").notNull(),
	organizationName: varchar("organization_name", { length: 255 }).notNull(),
	inCareOfName: varchar("in_care_of_name", { length: 500 }),
	streetAddress: varchar("street_address", { length: 500 }),
	city: varchar("city", { length: 255 }),
	state: varchar("state", { length: 100 }),
	zipCode: varchar("zip_code", { length: 12 }),
	groupExemptionNumber: smallint("group_exemption_number"),
	subsectionCode: tinyint("subsection_code"),
	affiliationCode: tinyint("affiliation_code"),
	classificationCode: int("classification_code"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	rulingDate: date("ruling_date", { mode: 'string' }),
	deductability: varchar("deductability", { length: 20 }),
	foundationCode: tinyint("foundation_code"),
	activityCode: int("activity_code"),
	organizationType: varchar("organization_type", { length: 12 }),
	exemptOrganizationStatusCode: tinyint("exempt_organization_status_code"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	taxPeriod: date("tax_period", { mode: 'string' }),
	assetCode: tinyint("asset_code"),
	incomeCode: tinyint("income_code"),
	incomeAmount: int("income_amount"),
	revenueAmount: int("revenue_amount"),
	filingRequirementCode: tinyint("filing_requirement_code"),
	pfFilingRequirement: tinyint("pf_filing_requirement"),
	nteeCode: char("ntee_code", { length: 3 }),
	sortName: varchar("sort_name", { length: 100 }),
},
(table) => {
	return {
		assetCodeIdx: index("asset_code_idx").on(table.assetCode),
		einIdx: index("ein_idx").on(table.ein),
		incomeCodeIdx: index("income_code_idx").on(table.incomeCode),
		nteeCodeIdx: index("ntee_code_idx").on(table.nteeCode),
		taxExemptOrgsOrganizationId: primaryKey(table.organizationId),
	}
});