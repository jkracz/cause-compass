// import "dotenv/config";
// import { connect } from "@planetscale/database";
// import { drizzle } from "drizzle-orm/planetscale-serverless";
// import googleSearch from "./search";
import { parseEoFile } from "./fileParse";

// const config = {
//     host: process.env.DATABASE_HOST,
//     username: process.env.DATABASE_USERNAME,
//     password: process.env.DATABASE_PASSWORD,
// };
// const conn = connect(config);
// const db = drizzle(conn);

const main = async () => {
    // googleSearch("Fabmo Logo")
    //     .then((results) => {
    //         console.log(results);
    //     })
    //     .catch(console.error);
    parseEoFile("eo_al.csv");
};

main();
