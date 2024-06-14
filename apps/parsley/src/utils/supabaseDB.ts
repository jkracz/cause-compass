import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./../db/schema";

const connectionString = process.env.DATABASE_URL || "";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

export type TaxExemptOrganizationInsertType = typeof schema.taxExemptOrganizations.$inferInsert;

export const insertManyTaxExemptOrganizationSb = async (profiles: TaxExemptOrganizationInsertType[]) => {
    return await db.insert(schema.taxExemptOrganizations).values(profiles).returning();
};

export const insertOneTaxExemptOrganizationSb = async (profile: TaxExemptOrganizationInsertType) => {
    return await db.insert(schema.taxExemptOrganizations).values(profile).returning();
};

export const closeClient = async () => {
    await client.end();
};
