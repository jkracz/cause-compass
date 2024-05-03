export interface NonprofitProfile {
    createdAt: string;
    lastUpdatedAt?: string;
    ein: string; // Employer Identification Number
    name: string; // Primary Name of Organization
    ico?: string; // In Care of Name
    street: string; // Street Address
    city: string; // City
    state: string; // State
    zip: string; // Zip Code
    group?: string; // Group Exemption Number
    subsection: string; // Subsection Code
    affiliation: string; // Affiliation Code
    classification: string; // Classification Code(s), array to accommodate multiple codes
    ruling: string; // Ruling Date
    deductibility: string; // Deductibility Code
    foundation: string; // Foundation Code
    activity: string; // Activity Codes, array for multiple codes
    organization: string; // Organization Code
    status: string; // Exempt Organization Status Code
    taxPeriod?: string; // Tax Period
    assetCode: string; // Asset Code
    incomeCode: string; // Income Code
    filingReqCode: string; // Filing Requirement Code
    pfFilingReqCode?: string; // PF Filing Requirement Code, optional as it may not apply to all
    acctPeriod: string; // Accounting Period
    assetAmt?: number; // Asset Amount
    incomeAmt?: number; // Income Amount
    revenueAmt?: number; // Revenue Amount
    nteeCode?: NteeCode; // NTEE Code
    sortName?: string; // Sort Name (Secondary Name Line)
    searchResults?: SearchResult[]; // Placeholder for search results
    aiGeneratedContent?: AIGeneratedContent; // Placeholder for AI-generated content
}

export interface SearchResult {
    title: string;
    snippet: string;
    url: string;
}

export interface AIGeneratedContent {
    contentName: string;
    generatedAt: string;
    content: string;
    references: Reference[];
}

export interface Reference {
    content: string;
    sources: Source[];
}

export interface Source {
    title: string;
    url: string;
}

export interface NteeCode {
    code: string;
    title: string;
    description: string;
    keywords?: string[];
}

export interface AssetCode {
    code: number;
    amountLow: number;
    amountHigh?: number;
}

export interface AffiliationCode {
    code: number;
    name: string;
    description: string;
}

export interface DeductibilityCode {
    code: number;
    description: string;
}

interface OrgCode {
    code: number;
    description: string;
}

interface FoundationCode {
    code: string;
    description: string;
}
