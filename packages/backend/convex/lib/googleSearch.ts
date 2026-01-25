/**
 * Google Custom Search API helper for Convex actions.
 * Uses native fetch instead of googleapis package for simplicity in Convex runtime.
 */

// Type declaration for environment variables in Convex actions
declare const process: {
  env: Record<string, string | undefined>;
};

export type SearchKeyType = "CC" | "PERSONAL" | "JKRACZ" | "SF" | "JK";

interface KeyConfig {
  apiKey: string | undefined;
  searchEngineId: string | undefined;
}

/**
 * Get API key configuration for a given key type.
 */
function getKeyConfig(keyType: SearchKeyType): KeyConfig {
  switch (keyType) {
    case "CC":
      return {
        apiKey: process.env.GOOGLE_SEARCH_API_KEY_CC,
        searchEngineId: process.env.SEARCH_ENGINE_ID_CC,
      };
    case "PERSONAL":
      return {
        apiKey: process.env.GOOGLE_SEARCH_API_KEY_PERSONAL,
        searchEngineId: process.env.SEARCH_ENGINE_ID_PERSONAL,
      };
    case "JKRACZ":
      return {
        apiKey: process.env.GOOGLE_SEARCH_API_KEY_JKRACZ,
        searchEngineId: process.env.SEARCH_ENGINE_ID_JKRACZ,
      };
    case "SF":
      return {
        apiKey: process.env.GOOGLE_SEARCH_API_KEY_SF,
        searchEngineId: process.env.SEARCH_ENGINE_ID_SF,
      };
    case "JK":
      return {
        apiKey: process.env.GOOGLE_SEARCH_API_KEY_JK,
        searchEngineId: process.env.SEARCH_ENGINE_ID_JK,
      };
  }
}

/**
 * Returns an array of available API key types based on configured environment variables.
 */
export function getAvailableKeys(): SearchKeyType[] {
  const allKeys: SearchKeyType[] = ["PERSONAL", "JKRACZ", "SF", "JK"];
  return allKeys.filter((keyType) => {
    const config = getKeyConfig(keyType);
    return config.apiKey && config.searchEngineId;
  });
}

export interface GoogleSearchResult {
  kind?: string;
  title?: string;
  htmlTitle?: string;
  link?: string;
  displayLink?: string;
  snippet?: string;
  htmlSnippet?: string;
  formattedUrl?: string;
  htmlFormattedUrl?: string;
  pagemap?: Record<string, unknown>;
}

export interface GoogleSearchResponse {
  kind?: string;
  url?: { type: string; template: string };
  queries?: {
    request?: Array<{
      totalResults: string;
      count: number;
      startIndex: number;
    }>;
    nextPage?: Array<{
      totalResults: string;
      count: number;
      startIndex: number;
    }>;
  };
  context?: { title: string };
  searchInformation?: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
  items?: GoogleSearchResult[];
}

/**
 * Performs a Google Custom Search API request.
 *
 * @param query - The search query string
 * @param keyType - Which API key to use
 * @returns The search response containing items array
 * @throws Error if API keys are not configured or request fails
 */
export async function googleSearch(
  query: string,
  keyType: SearchKeyType,
): Promise<GoogleSearchResponse> {
  const config = getKeyConfig(keyType);

  if (!config.apiKey) {
    throw new Error(
      `Missing GOOGLE_SEARCH_API_KEY_${keyType} environment variable`,
    );
  }
  if (!config.searchEngineId) {
    throw new Error(`Missing SEARCH_ENGINE_ID_${keyType} environment variable`);
  }

  const params = new URLSearchParams({
    key: config.apiKey,
    cx: config.searchEngineId,
    q: query,
  });

  const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Search API error (${response.status}): ${errorText}`,
    );
  }

  return response.json() as Promise<GoogleSearchResponse>;
}
