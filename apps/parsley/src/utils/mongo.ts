import { MongoClient, ServerApiVersion } from "mongodb";
import { NonprofitProfile } from "../types";
import "dotenv/config";

const uri: string = process.env.MONGO_CONNECTION_STRING || "";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

export const insertManyNonprofits = async (
    documents: NonprofitProfile[],
    dbName: string,
    collectionName: string
): Promise<void> => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const nonprofits = db.collection<NonprofitProfile>(collectionName);
        const result = await nonprofits.insertMany(documents);
        console.log(`${result.insertedCount} documents were inserted`);
    } catch (error) {
        console.error("Failed to insert documents:", error);
    } finally {
        await client.close();
    }
};
