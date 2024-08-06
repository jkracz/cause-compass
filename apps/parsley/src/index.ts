import "dotenv/config";
import { parseSearchResults } from "./scripts/parseSearchResults";
import { findTaxExemptOrgs, bulkUpdateOrgs } from "./utils/mongo";
import { TaxExemptOrganization } from "./types";
import { crawler } from "./scripts/crawlee";

const main = async () => {
    // await parseSearchResults();
    // const query = { searchResults: { $not: { $type: "array" } }, searchedAt: { $exists: true } };
    // const teo: TaxExemptOrganization[] = await findTaxExemptOrgs(1000, query);
    // for (const org of teo) {
    //     org.searchResults = org.searchResults.items;
    // }
    // bulkUpdateOrgs(teo);
    // await crawler.run(["https://www.duoduoproject.org/"]);
    await crawler.run(["https://www.makernexus.org/"]);
};

main().catch(console.error);
