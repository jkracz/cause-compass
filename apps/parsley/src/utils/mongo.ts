import { MongoClient, ServerApiVersion, AnyBulkWriteOperation, BulkWriteResult, Filter } from "mongodb";
import { TaxExemptOrganization } from "../types";
import "dotenv/config";

const mongoUser: string | undefined = process.env.MONGO_USER;
const mongoPassword: string | undefined = process.env.MONGO_PASSWORD;
if (!mongoUser) {
    throw new Error("Missing MONGO_USER environment variable");
} else if (!mongoPassword) {
    throw new Error("Missing MONGO_PASSWORD environment variable");
}
const uri: string = `mongodb+srv://${mongoUser}:${mongoPassword}@causecompass-1.xgfmikf.mongodb.net/?retryWrites=true&w=majority&appName=CauseCompass-1`;

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

export const findTaxExemptOrgs = async (
    limit: number,
    filter: Filter<TaxExemptOrganization>
): Promise<TaxExemptOrganization[]> => {
    try {
        await client.connect();
        const profiles = await tax_exempt_organizations.find(filter).limit(limit).toArray();
        return profiles;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve orgs from DB");
    } finally {
        await client.close();
    }
};

export const bulkUpdateOrgs = async (orgs: TaxExemptOrganization[]): Promise<void> => {
    try {
        await client.connect();

        const bulkOps: AnyBulkWriteOperation<TaxExemptOrganization>[] = orgs.map((org) => ({
            updateOne: {
                filter: { _id: org._id },
                update: { $set: org },
            },
        }));

        const result: BulkWriteResult = await tax_exempt_organizations.bulkWrite(bulkOps);
        console.log(`${result.modifiedCount} documents were modified`);
    } catch (error) {
        console.error(error);
        throw new Error("Failed to bulk update orgs");
    } finally {
        await client.close();
    }
};
