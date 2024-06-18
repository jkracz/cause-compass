import { TaxExemptOrganization } from "../types";
import { findTaxExemptOrgs } from "../utils/mongo";

export const parseSearchResults = async () => {
    // find one from mongo to start
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(1, { searchResults: { $exists: true } });
    const searchResultItems = orgs[0].searchResults?.items;
    console.log(searchResultItems);
    // get items
};
