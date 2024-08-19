import "dotenv/config";
import { parseSearchResults } from "./scripts/parseSearchResults";
import { findTaxExemptOrgs, bulkUpdateOrgs } from "./db/mongo";
import { TaxExemptOrganization } from "./types";
import { createCrawler, getLatestCrawlData } from "./utils/crawlee";

const main = async () => {
    // await parseSearchResults();
    // const query = { searchResults: { $not: { $type: "array" } }, searchedAt: { $exists: true } };
    // const teo: TaxExemptOrganization[] = await findTaxExemptOrgs(1000, query);
    // for (const org of teo) {
    //     org.searchResults = org.searchResults.items;
    // }
    // bulkUpdateOrgs(teo);
    const crawler = createCrawler(5, true);
    // await crawler.run(["https://www.fabmo.org/"]);
    // await crawler.run(["https://www.duoduoproject.org/"]);
    // await crawler.run(["https://www.makernexus.org/"]);
    await crawler.run(["https://myhero.com/"]);
    const data = await getLatestCrawlData();
    // console.log(data);
};

main().catch(console.error);
