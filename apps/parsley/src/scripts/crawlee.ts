import { PlaywrightCrawler, Dataset } from "crawlee";

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.

export const crawler = new PlaywrightCrawler({
    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ request, page, enqueueLinks, log }) {
        const title = await page.title();
        const textContent = await page.$eval("body", (element) => {
            const excludedTags = ["NAV", "HEADER", "FOOTER", "A"];
            const popUpSelectors = [".modal", ".overlay", ".popup"]; // Add common selectors for pop-ups

            // Remove elements matching excluded tags
            excludedTags.forEach((tag) => {
                const elements = element.getElementsByTagName(tag);
                for (let el of elements) {
                    el.parentNode?.removeChild(el);
                }
            });

            // Remove elements matching pop-up selectors
            popUpSelectors.forEach((selector) => {
                const elements = element.querySelectorAll(selector);
                for (let el of elements) {
                    el.parentNode?.removeChild(el);
                }
            });

            return element.innerText.trim();
        });

        log.info(`Title of ${request.loadedUrl} is '${title}'`);

        // Save results as JSON to ./storage/datasets/default
        await Dataset.pushData({ title, url: request.loadedUrl, textContent });

        // Extract links from the current page
        // and add them to the crawling queue.
        await enqueueLinks();
    },
    headless: true,
    // Let's limit our crawls to make our tests shorter and safer.
    maxRequestsPerCrawl: 5,
});
