import { pgTable, timestamp, text, varchar } from "drizzle-orm/pg-core";

export const taxExemptOrganizations = pgTable("tax_exempt_organizations", {
    id: varchar("id", { length: 22 }).primaryKey().notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    websiteUrl: varchar("website_url", { length: 500 }),
    imageUrl: varchar("image_url", { length: 500 }),
    ein: varchar("ein", { length: 9 }).unique(),
    name: varchar("name", { length: 255 }).notNull(),
    inCareOfName: varchar("in_care_of_name", { length: 255 }),
    streetAddress: text("street_address"),
    city: varchar("city", { length: 255 }),
    state: varchar("state", { length: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUpdated: timestamp("last_updated").defaultNow(),
    searchedAt: timestamp("searched_at"),
});
