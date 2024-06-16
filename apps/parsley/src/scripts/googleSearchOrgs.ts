import { TaxExemptOrganization } from "../types";
import { ObjectId } from "mongodb";
import { bulkUpdateOrgs, getTaxExemptOrgsToSearch } from "../utils/mongo";
import { googleSearch } from "../utils/googleSearch";
import "dotenv/config";

const googleSearchOrgs = async () => {
    const orgs: TaxExemptOrganization[] = await getTaxExemptOrgsToSearch();
    const processedIds: ObjectId[] = [];
    for (const org of orgs) {
        const searchQuery: string = `${org.name} ${org.city} ${org.state}`;
        const searchResults = await googleSearch(searchQuery);
        org.searchResults = searchResults;
        org.searchedAt = new Date().toISOString();
        if (org._id) {
            processedIds.push(org._id);
        }
    }
    await bulkUpdateOrgs(orgs);
    console.log("Documents IDs Processed:");
    console.log(processedIds);
};

googleSearchOrgs().catch(console.error);
