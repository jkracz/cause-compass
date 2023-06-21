import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

export default {
    schema: "./src/db/schema.ts",
    out: "./src/db/drizzle",
    dbCredentials: {
        connectionString: process.env.DATABASE_URL,
        host: process.env.DATABASE_HOST,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
    },
    breakpoints: true,
} satisfies Config;
