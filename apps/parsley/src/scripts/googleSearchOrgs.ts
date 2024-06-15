import { NonprofitProfile } from "../types";
import { bulkUpdateOrgs, getTaxExemptOrgsToSearch } from "../utils/mongo";
import { googleSearch } from "../utils/googleSearch";

const googleSearchOrgs = async () => {
    const orgs: NonprofitProfile[] = await getTaxExemptOrgsToSearch();
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
