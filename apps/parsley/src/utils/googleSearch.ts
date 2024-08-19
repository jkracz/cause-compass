import { google } from "googleapis";
import "dotenv/config";

const searchEngineId: string | undefined = process.env.SEARCH_ENGINE_ID;
const searchApiKey = process.env.GOOGLE_SEARCH_API_KEY;
if (!searchEngineId) {
    throw new Error("Missing SEARCH_ENGINE_ID environment variable");
} else if (!searchApiKey) {
    throw new Error("Missing GOOGLE_SEARCH_API_KEY environment variable");
}

/**
 * Performs a Google search using the Google Custom Search API.
 *
 * This function takes a search query as input and returns the search results
 * from the Google Custom Search Engine. It utilizes the provided search engine
 * ID and API key to authenticate the request.
 *
 * @param {string} query - The search query string to be sent to the Google Custom Search API.
 * @returns {Promise<any>} A promise that resolves to the search results returned by the API.
 * @throws {Error} Throws an error if the API request fails.
 */

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
