import { customsearch_v1, google } from "googleapis";
import { GoogleSearchApiKey, type GoogleSearchApiKeyType } from "@cause/types";
import "dotenv/config";

const keySets: Record<
  GoogleSearchApiKeyType,
  { searchEngineId?: string; searchApiKey?: string }
> = {
  [GoogleSearchApiKey.CC]: {
    searchEngineId: process.env.SEARCH_ENGINE_ID_CC,
    searchApiKey: process.env.GOOGLE_SEARCH_API_KEY_CC,
  },
  [GoogleSearchApiKey.PERSONAL]: {
    searchEngineId: process.env.SEARCH_ENGINE_ID_PERSONAL,
    searchApiKey: process.env.GOOGLE_SEARCH_API_KEY_PERSONAL,
  },
  [GoogleSearchApiKey.JKRACZ]: {
    searchEngineId: process.env.SEARCH_ENGINE_ID_JKRACZ,
    searchApiKey: process.env.GOOGLE_SEARCH_API_KEY_JKRACZ,
  },
  [GoogleSearchApiKey.SF]: {
    searchEngineId: process.env.SEARCH_ENGINE_ID_SF,
    searchApiKey: process.env.GOOGLE_SEARCH_API_KEY_SF,
  },
  [GoogleSearchApiKey.JK]: {
    searchEngineId: process.env.SEARCH_ENGINE_ID_JK,
    searchApiKey: process.env.GOOGLE_SEARCH_API_KEY_JK,
  },
} as const;

/**
 * Performs a Google search using the Google Custom Search API.
 *
 * This function takes a search query as input and returns the search results
 * from the Google Custom Search Engine. It utilizes the provided search engine
 * ID and API key to authenticate the request.
 *
 * @param {string} query - The search query string to be sent to the Google Custom Search API.
 * @param {GoogleSearchApiKeyType} keyFrom - The Google API key to use for the searching. Helpful when respecting the free limits.
 * @returns {Promise<any>} A promise that resolves to the search results returned by the API.
 * @throws {Error} Throws an error if the API request fails.
 */
export const googleSearch = async (
  query: string,
  keyFrom: GoogleSearchApiKeyType,
): Promise<customsearch_v1.Schema$Search> => {
  const { searchEngineId, searchApiKey } = keySets[keyFrom];
  if (!searchEngineId) {
    throw new Error("Missing SEARCH_ENGINE_ID environment variable");
  } else if (!searchApiKey) {
    throw new Error("Missing GOOGLE_SEARCH_API_KEY environment variable");
  }

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
