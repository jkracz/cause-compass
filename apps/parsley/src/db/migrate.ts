import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createConnection } from "mysql2";

const connection = createConnection("...");
const db = drizzle(connection);

const main = async () => {
    await migrate(db, { migrationsFolder: "drizzle" });
};

main();
