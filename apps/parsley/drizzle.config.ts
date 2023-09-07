import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

export default {
    schema: "./src/db/schema.ts",
    out: "./src/db/drizzle",
    driver: "mysql2",
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || "",
    },
} satisfies Config;
