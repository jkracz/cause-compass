import { TaxExemptOrganization, GoogleSearchApiKeyType } from "../types";
import { ObjectId } from "mongodb";
import { bulkUpdateOrgs, findTaxExemptOrgs } from "../db/mongo";
import { googleSearch } from "../utils/googleSearch";
import "dotenv/config";

// Define multiple keys
const apiKeys = [
    // GoogleSearchApiKeyType.CC,
    GoogleSearchApiKeyType.PERSONAL,
];

const googleSearchOrgs = async () => {
    const orgFilter = {
        $and: [
            {
                city: {
                    $in: [
                        "San Francisco",
                        "Oakland",
                        "San Jose",
                        "Berkeley",
                        "Palo Alto",
                        "Mountain View",
                        "Sunnyvale",
                        "Santa Clara",
                        "Redwood City",
                        "Fremont",
                        "Hayward",
                        "Cupertino",
                        "Menlo Park",
                    ],
                },
            },
            {
                $nor: [
                    { "deductibility.code": { $ne: "1" } },
                    { "activityCodes.category": { $in: ["Religious Activities"] } },
                    { "affiliation.code": "9" },
                    { "filingReqCode.code": { $in: ["06", "13", "14", "00"] } },
                    { "foundation.code": { $in: ["02", "03", "04", "10"] } },
                    { "status.code": { $in: ["12", "25"] } },
                ],
            },
            { $or: [{ searchedAt: { $exists: false } }, { searchedAt: undefined }] },
        ],
    };

    const SEARCH_LIMIT_PER_KEY = 100;
    const totalSearchLimit = SEARCH_LIMIT_PER_KEY * apiKeys.length;

    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(totalSearchLimit, orgFilter);
    const processedIds: ObjectId[] = [];

    const searchOrgsWithKey = async (startIndex: number, endIndex: number, keyType: GoogleSearchApiKeyType) => {
        const searchPromises = orgs.slice(startIndex, endIndex).map(async (org) => {
            const searchQuery = `${org.name} ${org.city} ${org.state}`;
            const searchResults = await googleSearch(searchQuery, keyType);
            org.searchResults = searchResults?.items || searchResults;
            org.searchedAt = new Date().toISOString();
        });

        // Wait for all searches to complete
        await Promise.all(searchPromises);

        // Bulk update after each key's search
        const processedOrgs = orgs.slice(startIndex, endIndex);
        const processedIds = processedOrgs.map((org) => org._id).filter(Boolean) as ObjectId[];

        await bulkUpdateOrgs(processedOrgs);
        console.log(`Documents IDs Processed for ${keyType}:`, processedIds);
    };

    // Process and save results for each key sequentially
    for (let i = 0; i < apiKeys.length; i++) {
        const keyType = apiKeys[i];
        const start = i * SEARCH_LIMIT_PER_KEY;
        const end = start + SEARCH_LIMIT_PER_KEY;
        await searchOrgsWithKey(start, end, keyType);
    }
};

googleSearchOrgs().catch(console.error);
