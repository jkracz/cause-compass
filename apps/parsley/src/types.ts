export interface NonprofitProfile {
    createdAt?: string;
    lastUpdatedAt?: string;
    searchDate?: string;
    aiGenDate?: string;
    liveProfileDate?: string;
    ein: string; // Employer Identification Number
    name: string; // Primary Name of Organization
    ico?: string; // In Care of Name
    street: string; // Street Address
    city: string; // City
    state: string; // State
    zip: string; // Zip Code
    group?: string; // Group Exemption Number
    subsection: string; // Subsection Code
    affiliation: AffiliationCode; // Affiliation Code
    classification: string; // Classification Code(s), array to accommodate multiple codes
    ruling: string; // Ruling Date
    deductibility: DeductibilityCode; // Deductibility Code
    foundation: FoundationCode; // Foundation Code
    activityCodes?: ActivityCode[]; // Activity Codes, array for multiple codes
    organization: OrgCode; // Organization Code
    status: string; // Exempt Organization Status Code
    taxPeriod?: string; // Tax Period
    assetCode: AssetCode; // Asset Code
    incomeCode: string; // Income Code
    filingReqCode: FilingRequirementCode; // Filing Requirement Code
    pfFilingReqCode?: FilingRequirementCode; // PF Filing Requirement Code, optional as it may not apply to all
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

interface NteeMajorCode {
    code: string;
    description: string;
    title: string;
}
export interface NteeCode {
    code: string;
    title: string;
    description: string;
    keywords?: string[];
    majorCode: NteeMajorCode;
}

export interface ActivityCode {
    code: string;
    description: string;
    category: string;
}

export interface AssetCode {
    code: string;
    lowerLimit: number;
    upperLimit?: number | null;
}

export interface AffiliationCode {
    code: string;
    code_name: string;
    description: string;
}

export interface DeductibilityCode {
    code: string;
    description: string;
}

export interface OrgCode {
    code: string;
    type: string;
}

export interface FoundationCode {
    code: string;
    description: string;
}

export interface FilingRequirementCode {
    code: string;
    description: string;
    form_number: string;
}
