import axios from "axios";
import "dotenv/config";

async function googleSearch(query: string): Promise<any> {
    try {
        const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
            params: {
                key: process.env.GOOGLE_SEARCH_API_KEY,
                cx: process.env.SEARCH_ENGINE_ID,
                q: query,
                searchType: "image",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error during Google Search API request:", error);
        throw error;
    }
}

export default googleSearch;
