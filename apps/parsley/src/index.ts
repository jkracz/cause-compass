import "dotenv/config";
import { parseSearchResults } from "./scripts/parseSearchResults";

const main = async () => {
    await parseSearchResults();
};

main().catch(console.error);
