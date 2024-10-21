import { createCrawler, getCrawlDataAsArray, cleanupCrawlerStorage } from "./crawler";
import { createAcronym, findBestUrls } from "../utils/parseUtils";
import { CrawlItem } from "../types";

(async () => {
    const org = JSON.parse(process.env.ORG_DATA!); // Parse the organization data

    const acronym = createAcronym(org.name);
    const bestUrls = findBestUrls(org, acronym);

    const confirmationCrawler = await createCrawler({
        addLinks: false,
        datasetName: org.name,
        requestQueueName: org.name,
        maxConcurrency: 20,
        maxRequestRetries: 1,
        worker: true,
    });

    await confirmationCrawler.run(bestUrls);

    const crawlItems: CrawlItem[] = await getCrawlDataAsArray(org.name, true);

    org.confirmationCrawlItems = crawlItems;
    org.resultsParsedAt = new Date().toISOString();

    // Send the updated org back to the main process
    process.send!(org);

    // Clean up the storage
    await cleanupCrawlerStorage(org.name, true);
    await confirmationCrawler.teardown();
    process.exit(0);
})();
