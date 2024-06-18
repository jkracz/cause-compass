import { TaxExemptOrganization } from "../types";
import { ObjectId } from "mongodb";
import { bulkUpdateOrgs, findTaxExemptOrgs } from "../utils/mongo";
import { googleSearch } from "../utils/googleSearch";
import "dotenv/config";

const googleSearchOrgs = async () => {
    const orgFilter = {
        $and: [
            // City must be one of the specified cities
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
            // None of these conditions should be true
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
            // should not have been searched before
            { $or: [{ searchedAt: { $exists: false } }, { searchedAt: undefined }] },
        ],
    };
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(100, orgFilter);
    const processedIds: ObjectId[] = [];
    for (const org of orgs) {
        const searchQuery: string = `${org.name} ${org.city} ${org.state}`;
        const searchResults = await googleSearch(searchQuery);
        org.searchResults = searchResults?.items || searchResults;
        org.searchedAt = new Date().toISOString();
        if (org._id) {
            processedIds.push(org._id);
        }
    }
    await bulkUpdateOrgs(orgs);
    console.log("Documents IDs Processed:");
    console.log(processedIds);
};

googleSearchOrgs().catch(console.error);
