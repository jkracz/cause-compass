import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./../db/schema";

const connectionString = process.env.DATABASE_URL || "";

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

export type taxExemptOrganizationInsertType = typeof schema.taxExemptOrganizations.$inferInsert;

export const insertManyTaxExemptOrganization = async (profiles: taxExemptOrganizationInsertType[]) => {
    return await db.insert(schema.taxExemptOrganizations).values(profiles).returning();
};

export const insertOneTaxExemptOrganization = async (profile: taxExemptOrganizationInsertType) => {
    return await db.insert(schema.taxExemptOrganizations).values(profile).returning();
};
