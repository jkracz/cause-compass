import { google } from "googleapis";
import "dotenv/config";

const searchEngineId: string | undefined = process.env.SEARCH_ENGINE_ID;
const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
if (!searchEngineId) {
    throw new Error("Missing SEARCH_ENGINE_ID environment variable");
} else if (!searchApiKey) {
    throw new Error("Missing GOOGLE_SEARCH_API_KEY environment variable");
}

export const googleSearch = async (query: string): Promise<any> => {
    const customsearch = google.customsearch("v1");
    try {
        const res = await customsearch.cse.list({
            cx: searchEngineId,
            q: query,
            auth: searchApiKey,
        });
        return res.data;
    } catch (error) {
        console.error("Error during Google Search API request:", error);
        throw error;
    }
};
