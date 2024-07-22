import { TaxExemptOrganization, SearchResult, Socials } from "../types";
import { findTaxExemptOrgs } from "../utils/mongo";

export const parseSearchResults = async () => {
    // Retrieve organizations from MongoDB
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(20, { searchResults: { $exists: true } });

    // Process each organization
    for (const org of orgs) {
        console.log("org:", org.name);
        const acronym = createAcronym(org.name);
        console.log("acronym:", acronym);

        // Extract search results and identify social media links
        const searchResult: SearchResult[] = org.searchResults || [];
        const socials: Socials = extractSocials(searchResult);

        console.log("Socials:", socials);

        // Determine and print the best URLs for the organization
        try {
            const bestUrls = findBestUrls(org, acronym);
            console.log("Best URLs:", bestUrls);
        } catch (error) {
            console.error("Error finding best URLs:", error.message);
        }
    }
};

const extractSocials = (searchResults: SearchResult[]): Socials => {
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

const normalize = (str: string): string => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
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
    if (normalizedUrl.includes("com")) score += 10;
    if (normalizedUrl.includes("net")) score += 10;

    // Prefer shorter URLs
    score -= normalizedUrl.length / 10;

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
    ];
    if (org.searchResults) {
        // Filter out social media URLs and duplicates
        const seenUrls = new Set<string>();
        const filteredResults = org.searchResults.filter((result) => {
            const normalizedUrl = normalize(result.displayLink);
            const isSocialMedia = excludePatterns.some((pattern) => pattern.test(result.displayLink));
            const isDuplicate = seenUrls.has(normalizedUrl);

            if (!isSocialMedia && !isDuplicate) {
                seenUrls.add(normalizedUrl);
                return true;
            }
            return false;
        });
        const scoredResults = filteredResults.map((result) => {
            return {
                link: result.displayLink,
                score: scoreUrl(result.displayLink, org.name, acronym),
            };
        });
        scoredResults.sort((a, b) => b.score - a.score);
        return scoredResults.map((result) => result.link);
    } else {
        throw new Error("No search results");
    }
};
