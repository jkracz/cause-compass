import { TaxExemptOrganization, SearchResult, Socials } from "../types";
import { findTaxExemptOrgs } from "../utils/mongo";

export const parseSearchResults = async () => {
    // Retrieve organizations from MongoDB
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(6, { searchResults: { $exists: true } });

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

    let score = 0;

    if (normalizedUrl.includes(normalizedOrgName)) score += 100;
    if (normalizedUrl.includes(normalizedAcronym)) score += 50;
    if (normalizedUrl.includes("org")) score += 20;
    if (normalizedUrl.includes("net")) score += 10;

    return score;
};

const findBestUrls = (org: TaxExemptOrganization, acronym: string): string[] => {
    if (org.searchResults) {
        const scoredResults = org.searchResults.map((result) => {
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
