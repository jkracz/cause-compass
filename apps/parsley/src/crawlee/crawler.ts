import { PlaywrightCrawler, Dataset, purgeDefaultStorages, RequestQueue, Configuration, KeyValueStore } from "crawlee";
import { CrawlItem } from "../types";

// process.env.CRAWLEE_MEMORY_MBYTES = "24000";

interface CrawlOptions {
    maxRequestsPerCrawl?: number;
    addLinks?: boolean;
    headless?: boolean;
    datasetName?: string;
    requestQueueName?: string;
    minConcurrency?: number;
    maxConcurrency?: number;
    maxRequestRetries?: number;
    worker?: boolean;
}

/**
 * Creates a PlaywrightCrawler instance configured for web crawling.
 *
 * @param {CrawlOptions} options - The options for the crawler.
 * @returns {PlaywrightCrawler} A configured instance of PlaywrightCrawler.
 */

export const createCrawler = async (options?: CrawlOptions) => {
    let config = undefined;
    if (options?.worker) {
        config = new Configuration({
            storageClientOptions: {
                localDataDirectory: `./storage/worker-${options.datasetName || "default"}`,
            },
        });
    }
    const dataset = options?.datasetName
        ? await Dataset.open(options.datasetName, { config })
        : await Dataset.open(null, { config });
    const requestQueue = options?.requestQueueName
        ? await RequestQueue.open(options.requestQueueName, { config })
        : await RequestQueue.open(null, { config });

    return new PlaywrightCrawler(
        {
            requestQueue,
            async requestHandler({ request, page, enqueueLinks, addRequests }) {
                // Find social media URLs
                const socialMediaUrls: string[] = await page.evaluate(() => {
                    const socialMediaPatterns = [
                        /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9(.?)]/,
                        /https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9(.?)]/,
                        /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9(.?)]/,
                        /https?:\/\/(www\.)?linkedin\.com\/[a-zA-Z0-9(.?)]/,
                        /https?:\/\/(www\.)?youtube\.com\/[a-zA-Z0-9(.?)]/,
                    ];
                    const urls: string[] = [];
                    socialMediaPatterns.forEach((pattern) => {
                        document.querySelectorAll("a").forEach((anchor) => {
                            if (pattern.test(anchor.href) && !urls.includes(anchor.href)) {
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

                // Find donation links
                const donationLinks = await page.evaluate(() => {
                    const donationPatterns = [/donate/i, /support/i, /contribute/i, /give/i, /fund/i];
                    const links: any[] = [];
                    document.querySelectorAll("a, button").forEach((element) => {
                        if (
                            donationPatterns.some((pattern) => pattern.test((element as HTMLElement).innerText)) &&
                            !links.includes((element as HTMLAnchorElement).href || element.closest("a")?.href)
                        ) {
                            links.push((element as HTMLAnchorElement).href || element.closest("a")?.href);
                        }
                    });
                    return links.filter((link) => link); // Filter out undefined links
                });

                // Find email addresses
                const emailAddresses: string[] = await page.evaluate(() => {
                    // Regex to match email addresses
                    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g;
                    const excludeDomains = ["wixpress", "sentry.io"];
                    const emails: string[] = [];
                    document.querySelectorAll("body *").forEach((element) => {
                        const text = (element as HTMLElement).innerText;
                        if (text) {
                            const foundEmails = text.match(emailPattern);
                            if (foundEmails) {
                                foundEmails.forEach((email) => {
                                    if (
                                        !emails.includes(email) &&
                                        !excludeDomains.some((domain) => email.endsWith(domain))
                                    ) {
                                        emails.push(email);
                                    }
                                });
                            }
                        }
                    });
                    return emails;
                });

                // Find logo links
                const logoLinks: string[] = await page.evaluate(() => {
                    const logos: Set<string> = new Set();
                    const logoSelectors = [
                        'header img[alt*="logo"]',
                        'header img[alt*="brand"]',
                        'nav img[alt*="logo"]',
                        'nav img[alt*="brand"]',
                        "img.logo",
                        "img.brand",
                        'img[src*="logo"]',
                        'img[src*="brand"]',
                    ];
                    logoSelectors.forEach((selector) => {
                        document.querySelectorAll(selector).forEach((img) => {
                            logos.add((img as HTMLImageElement).src);
                        });
                    });

                    // Additional check for class names containing 'logo'
                    const logoClassPattern = /logo/i;
                    document.querySelectorAll("img").forEach((img) => {
                        let element: HTMLElement | null = img;
                        while (element) {
                            if (logoClassPattern.test(element.className)) {
                                logos.add(img.src);
                                break;
                            }
                            element = element.parentElement;
                        }
                    });

                    return Array.from(logos);
                });

                // Find about links
                const aboutLinks = await page.evaluate(() => {
                    const aboutPatterns = [/about/i, /about-us/i, /history/i];
                    const currentDomain = window.location.hostname;
                    const links: string[] = [];
                    const seenLinks = new Set<string>();

                    document.querySelectorAll("a").forEach((element) => {
                        const href = (element as HTMLAnchorElement).href;

                        // Check if the URL matches the "about" patterns
                        if (aboutPatterns.some((pattern) => pattern.test(href))) {
                            const url = new URL(href);
                            const pathSegments = url.pathname.split("/").filter((segment) => segment !== "");

                            // Convert URL to lowercase for comparison and filtering
                            const lowerCaseHref = href.toLowerCase();

                            if (
                                url.hostname === currentDomain && // Check if it's the same domain
                                !href.includes("#") && // Exclude links with #
                                !href.includes("?") && // Exclude links with ?
                                pathSegments.length <= 1 && // Limit to one directory depth
                                !seenLinks.has(lowerCaseHref) && // Exclude duplicates
                                aboutPatterns.some((pattern) => pattern.test(url.pathname))
                            ) {
                                links.push(href);
                                seenLinks.add(lowerCaseHref);
                            }
                        }
                    });

                    return links;
                });
                // Add the aboutLinks to the front of the queue if they haven't been handled yet
                for (const aboutLink of aboutLinks) {
                    await addRequests([{ url: aboutLink }], { forefront: true });
                }

                const title = await page.title();
                const textContent = await page.$eval("body", (element) => {
                    const excludedTags = [
                        "nav",
                        "header",
                        "footer",
                        "button",
                        "form",
                        "input",
                        "textarea",
                        "select",
                        "aside",
                        "script",
                        "video",
                        "table",
                        "img",
                    ];
                    const popUpSelectors = [".modal", ".overlay", ".popup", "[role='dialog']", ".cookie-banner"];

                    // Remove elements matching excluded tags
                    excludedTags.forEach((tag) => {
                        const elements = element.getElementsByTagName(tag);
                        for (const el of elements) {
                            el.parentNode?.removeChild(el);
                        }
                    });

                    // Remove elements matching pop-up selectors
                    popUpSelectors.forEach((selector) => {
                        const elements = element.querySelectorAll(selector);
                        for (const el of elements) {
                            el.parentNode?.removeChild(el);
                        }
                    });

                    // Remove elements with specific classes
                    const regexClassSelectors = [/header/i, /footer/i, /menu/i, /btn/i, /cookie/i, /calendar/i];
                    regexClassSelectors.forEach((regex) => {
                        const elements = element.querySelectorAll("*");
                        elements.forEach((el) => {
                            // Ensure className is a string and split into individual class names
                            const classNames =
                                el.className && typeof el.className === "string" ? el.className.split(/\s+/) : [];
                            if (classNames.some((className) => regex.test(className))) {
                                el.remove();
                            }
                        });
                    });

                    // Get the remaining text content and clean it up
                    let content = element.innerText
                        .replace(/\n/g, " ") // Remove multiple newlines
                        .replace(/\t/g, " ") // Replace tabs with spaces
                        .replace(/ {2,}/g, " ") // Replace multiple spaces with a single space
                        .replace(/\s+([.,!?;:])/g, "$1") // Remove space before punctuation
                        .replace(/^\s+|\s+$/g, "") // Trim leading and trailing whitespace
                        .trim();

                    // Final clean-up for any lingering extra spaces or formatting issues
                    content = content.replace(/\s{2,}/g, " ").trim();

                    return content;
                });

                await dataset.pushData({
                    title,
                    url: request.loadedUrl,
                    textContent,
                    socialMediaUrls,
                    hasNewsletterSignup,
                    donationLinks,
                    emailAddresses,
                    logoLinks,
                    aboutLinks,
                });

                if (options?.addLinks || options?.addLinks === undefined) {
                    await enqueueLinks();
                }
            },
            headless: options?.headless || true,
            // Let's limit our crawls to make our tests shorter and safer.
            maxRequestsPerCrawl: options?.maxRequestsPerCrawl || undefined,
            minConcurrency: options?.minConcurrency || undefined,
            maxConcurrency: options?.maxConcurrency || undefined,
            maxRequestRetries: options?.maxRequestRetries || undefined,
        },
        config
    );
};

export const getCrawlDataAsArray = async (datasetName?: string, worker?: boolean): Promise<CrawlItem[]> => {
    let config = undefined;
    if (worker) {
        config = new Configuration({
            storageClientOptions: {
                localDataDirectory: `./storage/worker-${datasetName || "default"}`,
            },
        });
    }
    const dataset = datasetName ? await Dataset.open(datasetName, { config }) : Dataset;
    const data = await dataset.getData();
    return data.items as CrawlItem[];
};

export const cleanupCrawlerStorage = async (storageName?: string, worker?: boolean) => {
    if (storageName) {
        let config = undefined;
        if (worker) {
            config = new Configuration({
                storageClientOptions: {
                    localDataDirectory: `./storage/worker-${storageName}`,
                },
            });
        }
        const requestQueue = await RequestQueue.open(storageName, { config });
        await requestQueue.drop();
        const dataset = await Dataset.open(storageName, { config });
        await dataset.drop();
        const keyValueStore = await KeyValueStore.open(undefined, { config });
        await keyValueStore.drop();
    } else {
        await purgeDefaultStorages();
    }
};
