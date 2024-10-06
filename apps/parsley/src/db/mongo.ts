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

/**
 * Inserts many tax exempt organizations into the database.
 *
 * @param {TaxExemptOrganization[]} documents - The org documents to insert. Should be pre-validated.
 * @returns {Promise<void>} A configured instance of PlaywrightCrawler.
 */
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

/**
 * Finds tax exempt organizations in the database based on the provided filter.
 *
 * @param {Filter<TaxExemptOrganization>} filter - The filter to use for the query.
 * @param {number} limit - The maximum number of documents to return.
 * @returns {Promise<TaxExemptOrganization[]>} Orgs that match the filter.
 */
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

/**
 * Updates many tax exempt organizations in the database.
 *
 * @param {TaxExemptOrganization[]} orgs - The orgs to update. Should be pre-validated.
 * @returns {Promise<void>} Nothing.
 */
export const bulkUpdateOrgs = async (orgs: TaxExemptOrganization[]): Promise<void> => {
    if (orgs.length === 0) return;

    try {
        await client.connect();

        const bulkOps: AnyBulkWriteOperation<TaxExemptOrganization>[] = orgs.map((org) => ({
            updateOne: {
                filter: { _id: org._id },
                update: { $set: org },
            },
        }));
        console.dir(bulkOps, { depth: null });

        const result: BulkWriteResult = await tax_exempt_organizations.bulkWrite(bulkOps);
        console.log(`${result.modifiedCount} documents were modified, ${result.upsertedCount} were upserted`);
    } catch (error) {
        console.error("Failed to bulk update orgs:", error);
        throw new Error("Failed to bulk update orgs");
    } finally {
        await client.close();
    }
};

/**
 * Updates a single tax exempt organization in the database.
 *
 * @param {TaxExemptOrganization} org - The organization to update. Should be pre-validated.
 * @returns {Promise<void>} Nothing.
 */
export const updateOrg = async (org: TaxExemptOrganization): Promise<void> => {
    try {
        await client.connect();
        const result = await tax_exempt_organizations.updateOne({ _id: org._id }, { $set: org });
        if (result.modifiedCount === 0) {
            console.warn(`No documents were modified for org with id: ${org._id}`);
        } else {
            console.log(`Successfully updated org with id: ${org._id}`);
        }
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update org in DB");
    } finally {
        await client.close();
    }
};

