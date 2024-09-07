import { TaxExemptOrganization, SearchResult, Socials, CrawlItem } from "../types";
import { findTaxExemptOrgs } from "../db/mongo";
import { parse } from "tldts";
import { createCrawler, getCrawlDataAsArray, clearDataset } from "../utils/crawlee";
import { confirmWebsite } from "./chat";

export const parseSearchResults = async () => {
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(1, { searchResults: { $exists: true } });

    for (const org of orgs) {
        console.log(org.name);
        // Based on the search results, we create an acronym, try to parse out socials,
        // and find the URLs most likely to be the org's website
        const acronym = createAcronym(org.name);
        // const searchResult: SearchResult[] = org.searchResults || [];
        // const socials: Socials = extractSocialsFromSearchResults(searchResult);
        // console.log("Socials:", socials);

        const bestUrls = findBestUrls(org, acronym);
        console.log("Best URLs:", bestUrls);

        const confirmationDatasetName = `confirmation/${org.name}`;
        const confirmationCrawler = await createCrawler({
            addLinks: false,
            datasetName: confirmationDatasetName,
        });
        await confirmationCrawler.run(bestUrls);
        const crawlItems: CrawlItem[] = await getCrawlDataAsArray(confirmationDatasetName);
        const completionResponse = await confirmWebsite(crawlItems, org);
        console.dir({ message: "Completion Response:", data: completionResponse }, { depth: null, colors: true });
        const confirmedSite: string | null = completionResponse?.choices[0].message.parsed?.correctWebsiteUrl || null;
        let orgSite: string | null = null;
        // If the confirmed site is in the best URLs, set it as the org site
        // Otherwise, I'm not sure what the chatbot returned, so we'll leave it as null
        if (confirmedSite) {
            const matchingUrls = bestUrls.filter((url) => {
                const normalizedUrl = normalize(url);
                const normalizedOrgSite = normalize(confirmedSite);
                return normalizedUrl.includes(normalizedOrgSite) || normalizedOrgSite.includes(normalizedUrl);
            });
            if (matchingUrls.length > 0) {
                orgSite = matchingUrls[0];
            }
            if (orgSite !== null) {
                const correctCrawlItems = crawlItems.filter((item) => orgSite && item.url.includes(orgSite));
                console.log("Social URLs:", correctCrawlItems[0].socialMediaUrls);
            }
        }
        // await clearDataset(confirmationDatasetName);
    }
};

const extractSocialsFromSearchResults = (searchResults: SearchResult[]): Socials => {
    const socialUrls = {
        linkedin: /https?:\/\/(www\.)?linkedin\.com\/company\/?/,
        youtube: /https?:\/\/(www\.)?youtube\.com\/channel\/?/,
        x: /https?:\/\/(www\.)?x\.com\/?/,
        twitter: /https?:\/\/(www\.)?twitter\.com\/?/,
        instagram: /https?:\/\/(www\.)?instagram\.com\/?/,
        threads: /https?:\/\/(www\.)?threads\.net\/?/,
        facebook: /https?:\/\/(www\.)?facebook\.com\/?/,
    };

    const socials: Socials = {};
    for (const result of searchResults) {
        for (const platform in socialUrls) {
            if (Object.prototype.hasOwnProperty.call(socialUrls, platform)) {
                const regex = socialUrls[platform as keyof typeof socialUrls];
                if (regex.test(result.link)) {
                    socials[platform as keyof typeof socials] = result.link;
                }
            }
        }
    }
    return socials;
};

const createAcronym = (str: string) => {
    return str
        .split(/\s+/)
        .map((word) => word[0].toUpperCase())
        .join("");
};

const normalize = (url: string): string => {
    const parsed = parse(url);
    return parsed.domain ? parsed.domain.toLowerCase() : url.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const hasSubdomain = (url: string): boolean => {
    const parsed = parse(url);
    return parsed.subdomain !== "www" && parsed.subdomain !== "";
};

const scoreUrl = (url: string, orgName: string, acronym: string): number => {
    const normalizedUrl = normalize(url);
    const normalizedOrgName = normalize(orgName);
    const normalizedAcronym = normalize(acronym);
    const keywords = orgName.split(/\s+/).map(normalize);

    let score = 0;

    // Exact matches for org name and acronym
    if (normalizedUrl.includes(normalizedOrgName)) score += 100;
    if (normalizedUrl.includes(normalizedAcronym)) score += 50;

    // Partial matches for keywords
    for (const keyword of keywords) {
        if (normalizedUrl.includes(keyword)) score += 20;
        if (normalizedUrl.startsWith(keyword)) score += 10;
    }

    // Domain scoring
    if (normalizedUrl.includes("org")) score += 20;

    return score;
};

const findBestUrls = (org: TaxExemptOrganization, acronym: string): string[] => {
    const excludePatterns = [
        /(www\.)?linkedin\.com\/?/,
        /(www\.)?youtube\.com/,
        /(www\.)?x\.com\/?/,
        /(www\.)?twitter\.com\/?/,
        /(www\.)?instagram\.com\/?/,
        /(www\.)?threads\.net\/?/,
        /(www\.)?facebook\.com\/?/,
        /(www\.)?en.wikipedia\.org/,
        /(www\.)?guidestar\.org\/?/,
        /(www\.)?greatnonprofits\.org\/?/,
        /(www\.)?irs\.gov/,
        /(www\.)?sec\.gov/,
        /(www\.)?zillow\.com/,
        /(www\.)?volunteermatch\.org/,
    ];

    if (org.searchResults) {
        const seenUrls = new Set<string>();
        const filteredResults = org.searchResults.filter((result) => {
            const normalizedUrl = normalize(result.displayLink);
            const isSocialMedia = excludePatterns.some((pattern) => pattern.test(result.displayLink));
            const isDuplicate = seenUrls.has(normalizedUrl);
            const containsSubdomain = hasSubdomain(result.displayLink);

            if (!isSocialMedia && !isDuplicate && !containsSubdomain) {
                seenUrls.add(normalizedUrl);
                return true;
            }
            return false;
        });

        const scoredResults = filteredResults.map((result) => {
            return {
                link: result.displayLink,
                fullLink: result.link,
                score: scoreUrl(result.displayLink, org.name, acronym),
            };
        });
        // console.log("Scored results:", scoredResults);
        scoredResults.sort((a, b) => b.score - a.score);
        return scoredResults.map((result) => {
            result.link;
            return result.fullLink.startsWith("https://") || result.fullLink.startsWith("http://")
                ? `https://${result.link}`
                : `http://${result.link}`;
        });
    }
    return [];
};
