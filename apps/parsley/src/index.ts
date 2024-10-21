import "dotenv/config";
import { writeConfirmationFile } from "./scripts/generateBatchConfirmationFile";
// import { createCrawler } from "./crawlee/crawler";

const main = async () => {
    // console.time("fork");
    // await parseSearchResults();
    // console.timeEnd("fork");
    await writeConfirmationFile();

    // const aboutPatterns = [/about/i, /about-us/i, /history/i, /mission/i];
    // const href = "https://taiwaneseamericanhistory.org/culture-3/";
    // const url = new URL(href);

    // if (aboutPatterns.some((pattern) => pattern.test(url.pathname))) {
    //     const pathSegments = url.pathname.split("/").filter((segment) => segment !== "");

    //     // Convert URL to lowercase for comparison and filtering
    //     const lowerCaseHref = href.toLowerCase();
    //     console.log("lowerCaseHref", lowerCaseHref);

    //     if (
    //         !href.includes("#") && // Exclude links with #
    //         pathSegments.length <= 1 // Limit to one directory depth
    //     ) {
    //         console.log("pathSegments", pathSegments);
    //     }
    // }

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
    process.exit(0);
};

main().catch(console.error);
