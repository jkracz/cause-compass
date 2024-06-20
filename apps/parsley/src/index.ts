import "dotenv/config";
import { parseSearchResults } from "./scripts/parseSearchResults";
import { findTaxExemptOrgs, bulkUpdateOrgs } from "./utils/mongo";
import { TaxExemptOrganization } from "./types";

const main = async () => {
    await parseSearchResults();
    // const query = { searchResults: { $not: { $type: "array" } }, searchedAt: { $exists: true } };
    // const teo: TaxExemptOrganization[] = await findTaxExemptOrgs(1000, query);
    // for (const org of teo) {
    //     org.searchResults = org.searchResults.items;
    // }
    // bulkUpdateOrgs(teo);
};

main().catch(console.error);
