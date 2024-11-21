import { MongoClient, ServerApiVersion, AnyBulkWriteOperation, BulkWriteResult, Filter, Db, ObjectId } from "mongodb";
import { TaxExemptOrganization } from "@/types";
import "dotenv/config";
import { logger } from "@/utils/logger";

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
let isConnecting: Promise<void> | null = null;

export const connectToDatabase = async () => {
    if (client) return;
    
    if (isConnecting) {
        await isConnecting;
        return;
    }

    isConnecting = (async () => {
        try {
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
        } catch (error) {
            logger.error("Failed to connect to database:", error);
            throw error;
        } finally {
            isConnecting = null;
        }
    })();

    await isConnecting;
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
        logger.info(`${result.insertedCount} documents were inserted`);
    } catch (error) {
        logger.error("Failed to insert documents:", error);
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
        logger.error("Failed to retrieve orgs from DB:", error);
        throw new Error("Failed to retrieve orgs from DB");
    }
};

export const bulkUpdateOrgs = async (orgs: TaxExemptOrganization[]): Promise<void> => {
    if (orgs.length === 0) return;
    logger.info(`Updating ${orgs.length} organizations`);

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
        logger.info(`${result.modifiedCount} documents were modified, ${result.upsertedCount} were upserted`);
    } catch (error) {
        logger.error("Failed to bulk update orgs:", error);
        throw error;
    }
};

export const updateOrg = async (org: TaxExemptOrganization): Promise<void> => {
    try {
        await connectToDatabase();
        const result = await tax_exempt_organizations.updateOne({ _id: org._id }, { $set: org });
        if (result.modifiedCount === 0) {
            logger.warn(`No documents were modified for org with id: ${org._id}`);
        } else {
            logger.info(`Successfully updated org with id: ${org._id}`);
        }
    } catch (error) {
        logger.error(error);
        throw new Error("Failed to update org in DB");
    }
};

process.on('SIGINT', async () => {
    await disconnectFromDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnectFromDatabase();
    process.exit(0);
});

// Handle cleanup on normal exit
process.on('exit', () => {
    if (client) {
        client.close(true); // Force close
    }
});

// Handle cleanup on unhandled rejections
process.on('unhandledRejection', async (reason) => {
    logger.error('Unhandled Rejection at:', reason);
    await disconnectFromDatabase();
    process.exit(1);
});
