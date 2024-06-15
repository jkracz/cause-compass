import "dotenv/config";
import { parseEoFile } from "./utils/parseEoFile";
import { NonprofitProfile } from "./types";
import path from "path";
import { jsonFileWrite } from "./utils/fileWrite";
import { getTaxExemptOrgsToSearch } from "./utils/mongo";
import { googleSearch } from "./utils/googleSearch";

const main = async () => {
    const orgs: NonprofitProfile[] = await getTaxExemptOrgsToSearch();
    for (const org of orgs) {
        const searchQuery: string = `${org.name} ${org.city} ${org.state}`;
        // console.log(searchQuery);
        org.searchedAt = new Date().toISOString();
        org.searchResults = { query: searchQuery };
        console.log(org);
        // const searchResults = await googleSearch();
    }
};

main().catch(console.error);
