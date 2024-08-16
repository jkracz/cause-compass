import { PlaywrightCrawler, Dataset } from "crawlee";

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.

/**
 * Creates a PlaywrightCrawler instance configured for web crawling.
 *
 * @param {number} maxRequestsPerCrawl - The maximum number of requests to be made per crawl. Default is 5.
 * @param {boolean} headless - Whether to run the browser in headless mode. False means the browser will be visible. Default is true.
 * @returns {PlaywrightCrawler} A configured instance of PlaywrightCrawler.
 */

export const createCrawler = (maxRequestsPerCrawl: number = 5, headless: boolean = true) => {
    return new PlaywrightCrawler({
        // Use the requestHandler to process each of the crawled pages.
        async requestHandler({ request, page, enqueueLinks, log }) {
            // Find social media URLs
            const socialMediaUrls: string[] = await page.evaluate(() => {
                const socialMediaPatterns = [
                    /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9(\.\?)?]/,
                    /https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9(\.\?)?]/,
                    /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9(\.\?)?]/,
                    /https?:\/\/(www\.)?linkedin\.com\/[a-zA-Z0-9(\.\?)?]/,
                    /https?:\/\/(www\.)?youtube\.com\/[a-zA-Z0-9(\.\?)?]/,
                ];
                const urls: string[] = [];
                socialMediaPatterns.forEach((pattern) => {
                    document.querySelectorAll("a").forEach((anchor) => {
                        if (pattern.test(anchor.href)) {
                            urls.push(anchor.href);
                        }
                    });
                });
                return urls;
            });

            // Check for newsletter sign-up forms
            const hasNewsletterSignup = await page.evaluate(() => {
                const emailInput = document.querySelector('input[type="email"]');
                const submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
                return emailInput !== null && submitButton !== null;
            });

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
            await Dataset.pushData({
                title,
                url: request.loadedUrl,
                textContent,
                socialMediaUrls,
                hasNewsletterSignup,
            });

            // Extract links from the current page
            // and add them to the crawling queue.
            await enqueueLinks();
        },
        headless: headless,
        // Let's limit our crawls to make our tests shorter and safer.
        maxRequestsPerCrawl: maxRequestsPerCrawl,
    });
};

export const getLatestCrawlData = async () => {
    return await Dataset.getData();
};