import { google } from "googleapis";
import "dotenv/config";

export const googleSearch = async (query: string): Promise<any> => {
    const customsearch = google.customsearch("v1");
    try {
        const res = await customsearch.cse.list({
            cx: process.env.SEARCH_ENGINE_ID,
            q: query,
            auth: process.env.GOOGLE_SEARCH_API_KEY,
        });
        return res.data;
    } catch (error) {
        console.error("Error during Google Search API request:", error);
        throw error;
    }
};
