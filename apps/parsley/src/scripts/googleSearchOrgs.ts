import { TaxExemptOrganization } from "../types";
import { bulkUpdateOrgs, getTaxExemptOrgsToSearch } from "../utils/mongo";
import { googleSearch } from "../utils/googleSearch";
import "dotenv/config";

const googleSearchOrgs = async () => {
    const orgs: TaxExemptOrganization[] = await getTaxExemptOrgsToSearch();
    for (const org of orgs) {
        const searchQuery: string = `${org.name} ${org.city} ${org.state}`;
        const searchResults = await googleSearch(searchQuery);
        org.searchResults = searchResults;
        org.searchedAt = new Date().toISOString();
    }
    await bulkUpdateOrgs(orgs);
};

googleSearchOrgs().catch(console.error);
