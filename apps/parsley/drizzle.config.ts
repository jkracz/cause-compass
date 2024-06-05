import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/db/drizzle",
    dialect: "postgresql",
    introspect: {
        casing: "preserve",
    },
});
