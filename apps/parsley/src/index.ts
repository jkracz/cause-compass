import "dotenv/config";
// import googleSearch from "./search";
import { parseEoFile } from "./utils/fileParse";
import { insertManyNonprofits } from "./utils/mongo";

const main = async () => {
    // googleSearch("Fabmo Logo")
    //     .then((results) => {
    //         console.log(results);
    //     })
    //     .catch(console.error);

    const profiles = await parseEoFile("eo_ca.csv");
    await insertManyNonprofits(profiles, "causecompass", "nonprofits");
};

main();
