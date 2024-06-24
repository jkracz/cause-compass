import { TaxExemptOrganization, SearchResult } from "../types";
import { findTaxExemptOrgs } from "../utils/mongo";
import { createAcronym } from "../utils/createAcronym";

export const parseSearchResults = async () => {
    // find one from mongo to start
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(1, { searchResults: { $exists: true } });
    // get items
    const orgName: string = orgs[0].name;
    console.log(orgName);
    console.log(createAcronym(orgName));
    const searchResult: SearchResult[] = orgs[0].searchResults ? orgs[0].searchResults : [];
    // console.log(searchResult);
    // find the links in each item
    // Get social links (if there are any) and remove them to be confirmed later
    const re: RegExp = new RegExp("linkedin");
    const socials: RegExp[] = [/linkedin/, /youtube/, /facebook/, /instagram/, /twitter/, /x/, /threads/];
    for (const result of searchResult) {
        // console.log(re.search());
        const reg = result.displayLink.search(re);
        console.log(reg, result.link);
    }
    // remove any news links
    // determine best candidates for parsing (has name in url, has .org, has some acronym)
};
