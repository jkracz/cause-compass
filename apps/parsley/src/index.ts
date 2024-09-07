import "dotenv/config";
import { parseSearchResults } from "./scripts/parseSearchResults";
import { createCrawler } from "./utils/crawlee";

const main = async () => {
    await parseSearchResults();

    // const crawler = await createCrawler({ addLinks: false });
    // await crawler.run([
    //     "https://www.makernexus.org/",
    //     "https://myhero.com/",
    //     "https://www.duoduoproject.org/",
    //     "https://www.fabmo.org/",
    //     "https://www.killingmylobster.com/",
    // ]);
    // const data = await getLatestCrawlData();
    // console.log(data);

    // const crawler2 = await createCrawler({
    //     datasetName: "test",
    //     maxRequestsPerCrawl: 4,
    // });
    // await crawler2.run(["https://www.killingmylobster.com/"]);

    // const crawler = createCrawler(5);
    // await crawler.run(["https://www.killingmylobster.com/"]);
    // const data = await getLatestCrawlData();
    // console.log(data);
};

main().catch(console.error);
