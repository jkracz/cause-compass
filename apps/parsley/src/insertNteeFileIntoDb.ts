import * as fs from "fs";
import { join } from "path";

import "dotenv/config";
import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { ntee_major_code as nteeMajorCode, ntee_code as nteeCode } from "./db/drizzle/schema";
import { eq } from "drizzle-orm";

type NteeCode = typeof nteeCode.$inferSelect;
type MajorNteeCode = typeof nteeMajorCode.$inferSelect;

const config = {
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
};

const conn = connect(config);
const db = drizzle(conn);

const insertNteeFileIntoDb = async (fname: string) => {
    const currentPath = join(__dirname, "../data/needs_imported", fname);
    const destinationPath = join(__dirname, "../data/imported", fname);
    try {
        const file = await fs.promises.open(currentPath, "r");

        for await (const line of file.readLines()) {
            const lineSplit = line.split("\t");
            if (lineSplit[0].length === 1) {
                const majorNtee: MajorNteeCode[] = await db
                    .select()
                    .from(nteeMajorCode)
                    .where(eq(nteeMajorCode.code, lineSplit[0]));
                if (majorNtee.length == 0) {
                    await db
                        .insert(nteeMajorCode)
                        .values({ code: lineSplit[0], category: lineSplit[1], description: lineSplit[2] });
                }
            } else {
                const ntee: NteeCode[] = await db.select().from(nteeCode).where(eq(nteeCode.code, lineSplit[0]));
                if (ntee.length === 0) {
                    await db.insert(nteeCode).values({
                        code: lineSplit[0],
                        category: lineSplit[1],
                        description: lineSplit[2],
                        major_code: lineSplit[0][0],
                    });
                }
            }
        }
        console.log(`FINISHED INSERTING ALL NEW RECORDS FROM: ${fname}`);

        fs.rename(currentPath, destinationPath, function (err) {
            if (err) {
                throw err;
            } else {
                console.log(`MOVED FILE TO: ${destinationPath}`);
            }
        });
    } catch (err) {
        console.log(`COULD NOT INSERT FILE BECAUSE OF ERROR:\n${err}`);
    }
};

insertNteeFileIntoDb("ntee.txt");
