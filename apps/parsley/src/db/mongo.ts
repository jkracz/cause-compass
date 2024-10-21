import { MongoClient, ServerApiVersion, AnyBulkWriteOperation, BulkWriteResult, Filter, Db, ObjectId } from "mongodb";
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

let client: MongoClient;
let db: Db;
let tax_exempt_organizations: any;

export const connectToDatabase = async () => {
    if (!client) {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        await client.connect();
        db = client.db("CauseCompass-1");
        tax_exempt_organizations = db.collection<TaxExemptOrganization>("tax_exempt_organizations");
    }
};

export const disconnectFromDatabase = async () => {
    if (client) {
        await client.close();
    }
};

// Update other functions to use connectToDatabase
export const insertManyTaxExemptOrgs = async (documents: TaxExemptOrganization[]): Promise<void> => {
    try {
        await connectToDatabase();
        const result = await tax_exempt_organizations.insertMany(documents);
        console.log(`${result.insertedCount} documents were inserted`);
    } catch (error) {
        console.error("Failed to insert documents:", error);
    }
};

export const findTaxExemptOrgs = async (
    limit: number,
    filter: Filter<TaxExemptOrganization>
): Promise<TaxExemptOrganization[]> => {
    try {
        await connectToDatabase();
        const profiles = await tax_exempt_organizations.find(filter).limit(limit).toArray();
        return profiles;
    } catch (error) {
        console.error(error);
        throw new Error("Failed to retrieve orgs from DB");
    }
};

export const bulkUpdateOrgs = async (orgs: TaxExemptOrganization[]): Promise<void> => {
    if (orgs.length === 0) return;
    console.log(orgs[0]._id);

    try {
        await connectToDatabase();

        const bulkOps: AnyBulkWriteOperation<TaxExemptOrganization>[] = orgs.map((org) => {
            const { _id, ...updateData } = org;
            return {
                updateOne: {
                    filter: { _id: new ObjectId(_id) },
                    update: { $set: updateData },
                },
            };
        });

        const result: BulkWriteResult = await tax_exempt_organizations.bulkWrite(bulkOps);
        console.log(`${result.modifiedCount} documents were modified, ${result.upsertedCount} were upserted`);
        await disconnectFromDatabase();
    } catch (error) {
        console.error("Failed to bulk update orgs:", error);
        throw new Error("Failed to bulk update orgs");
    }
};

export const updateOrg = async (org: TaxExemptOrganization): Promise<void> => {
    try {
        await connectToDatabase();
        const result = await tax_exempt_organizations.updateOne({ _id: org._id }, { $set: org });
        if (result.modifiedCount === 0) {
            console.warn(`No documents were modified for org with id: ${org._id}`);
        } else {
            console.log(`Successfully updated org with id: ${org._id}`);
        }
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update org in DB");
    }
};

