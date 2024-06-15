import { TaxExemptOrganization } from "../types";
import { bulkUpdateOrgs, getTaxExemptOrgsToSearch } from "../utils/mongo";
import { googleSearch } from "../utils/googleSearch";
import "dotenv/config";

const googleSearchOrgs = async () => {
    console.log("GOOGLE_SEARCH_API_KEY:", process.env.GOOGLE_SEARCH_API_KEY);
    console.log("MONGO_CONNECTION_STRING:", process.env.MONGO_CONNECTION_STRING);
    console.log("SEARCH_ENGINE_ID:", process.env.SEARCH_ENGINE_ID);
    const orgs: TaxExemptOrganization[] = await getTaxExemptOrgsToSearch();
    for (const org of orgs) {
        const searchQuery: string = `${org.name} ${org.city} ${org.state}`;
        const searchResults = await googleSearch(searchQuery);
        org.searchResults = searchResults;
        org.searchedAt = new Date().toISOString();
        console.log(org);
    }
    await bulkUpdateOrgs(orgs);
};

googleSearchOrgs().catch(console.error);
