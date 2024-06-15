import { MongoClient, ServerApiVersion, AnyBulkWriteOperation } from "mongodb";
import { TaxExemptOrganization } from "../types";
import "dotenv/config";

const uri: string | undefined = process.env.MONGO_CONNECTION_STRING;
if (!uri) {
    throw new Error("Missing MONGO_CONNECTION_STRING environment variable");
}
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const db = client.db("CauseCompass-1");
const tax_exempt_organizations = db.collection<TaxExemptOrganization>("tax_exempt_organizations");

export const insertManyTaxExemptOrgs = async (documents: TaxExemptOrganization[]): Promise<void> => {
    try {
        await client.connect();
        const result = await tax_exempt_organizations.insertMany(documents);
        console.log(`${result.insertedCount} documents were inserted`);
    } catch (error) {
        console.error("Failed to insert documents:", error);
    } finally {
        await client.close();
    }
};

export const getTaxExemptOrgsToSearch = async (): Promise<TaxExemptOrganization[]> => {
    try {
        await client.connect();
        const profiles = await tax_exempt_organizations
            .find({
                $nor: [
                    { "deductibility.code": { $ne: "1" } },
                    { "activityCodes.category": { $in: ["Religious Activities"] } },
                    { "affiliation.code": "9" },
                    { "filingReqCode.code": { $in: ["06", "13", "14", "00"] } },
                    { "foundation.code": { $in: ["02", "03", "04", "10"] } },
                    { "status.code": { $in: ["12", "25"] } },
                ],
                $or: [{ searchedAt: { $exists: false } }, { searchedAt: undefined }],
            })
            .limit(2)
            .toArray();
        return profiles;
    } catch (error) {
        console.error("Failed to retrieve orgs to search:", error);
        return [];
    } finally {
        await client.close();
    }
};

export const bulkUpdateOrgs = async (orgs: TaxExemptOrganization[]): Promise<void> => {
    try {
        await client.connect();

        const bulkOps: AnyBulkWriteOperation<TaxExemptOrganization>[] = orgs.map((org) => ({
            updateOne: {
                filter: { _id: org._id }, // Assuming _id is the identifier field
                update: { $set: org },
            },
        }));

        const result = await tax_exempt_organizations.bulkWrite(bulkOps);
        console.log(`${result.modifiedCount} documents were updated`);
    } catch (error) {
        console.error("Failed to update documents:", error);
    } finally {
        await client.close();
    }
};
