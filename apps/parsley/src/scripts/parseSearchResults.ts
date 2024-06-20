import { TaxExemptOrganization, SearchResult } from "../types";
import { findTaxExemptOrgs } from "../utils/mongo";

export const parseSearchResults = async () => {
    // find one from mongo to start
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(1, { searchResults: { $exists: true } });
    // get items
    console.log(orgs[0].name);
    const searchResult: SearchResult[] = orgs[0].searchResults ? orgs[0].searchResults : [];
    console.log(searchResult);
    // find the links in each item
    // Get social links (if there are any) and remove them to be confirmed later
    const socials: string[] = ["linkedin", "youtube", "facebook", "instagram", "twitter", "x", "threads"];
    for (const result in searchResult) {
    }
    // remove any news links
    // determine best candidates for parsing (has name in url, has .org, has some acronym)
};

export const createAcronym = (fullString: string) => {
    // add code to determine acronym of org
};
