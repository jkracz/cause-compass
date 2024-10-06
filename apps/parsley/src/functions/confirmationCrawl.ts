import { createCrawler, getCrawlDataAsArray } from "../crawlee/crawler";

export async function handler() {
    const confirmationCrawler = await createCrawler({
        addLinks: false,
        datasetName: "test",
        requestQueueName: "test",
    });

    await confirmationCrawler.run(["https://www.killingmylobster.com/"]);
    const output = await getCrawlDataAsArray("test");
    console.log("output", output);
    return JSON.stringify(output);
}
