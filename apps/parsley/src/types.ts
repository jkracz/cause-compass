import { ObjectId } from "mongodb";
import { z } from "zod";
export interface TaxExemptOrganization {
    createdAt?: string;
    lastUpdated?: string;
    searchedAt?: string;
    _id?: ObjectId;
    dbId?: string;
    slug?: string;
    batchJobId?: string; // Internal batch job ID used by our system
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
    status: EOStatusCode; // Exempt Organization Status Code
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
    searchResults?: SearchResult[];
    searchKey?: GoogleSearchApiKeyType;
    resultsParsedAt?: string; // when the search results were parsed and the sites were crawled
    confirmationCrawlItems?: CrawlItem[];
    aiConfirmationResponse?: OpenAIResponse;
    socialMediaUrls?: SocialMediaUrls;
    donationUrl?: string;
    emailAddresses?: string[];
    logoUrl?: string;
    websiteUrl?: string;
    oneSentenceSummary?: string;
    whySupport?: string;
    mission?: string;
    tagline?: string;
    uniqueTrait?: string;
    targetAudience?: string;
    geographicFocus?: string;
    keywords?: string[];
    activities?: Activity[];
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

export interface EOStatusCode {
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

export interface SearchResult {
    kind: string;
    title: string;
    htmlTitle: string;
    link: string;
    displayLink: string;
    snippet: string;
    htmlSnippet: string;
    formattedUrl: string;
    htmlFormattedUrl: string;
    pagemap: object;
}

export interface SocialMediaUrls {
    linkedin?: string;
    youtube?: string;
    x?: string;
    instagram?: string;
    threads?: string;
    facebook?: string;
    twitter?: string;
}

export enum GoogleSearchApiKeyType {
    PERSONAL = "PERSONAL",
    JKRACZ = "JKRACZ",
    SF = "SF",
    JK = "JK",
}

export interface CrawlItem {
    title: string;
    url: string;
    textContent: string;
    socialMediaUrls?: string[];
    hasNewsletterSignup?: boolean;
    donationLinks?: string[];
    emailAddresses?: string[];
    logoLinks?: string[];
    aboutLinks?: string[];
}

export interface BatchJob {
    id: string;
    status: "pending" | "generating" | "uploading" | "processing" | "downloading" | "completed" | "failed";
    createdAt: string;
    updatedAt: string;
    batchSize: number;
    fileId?: string; // OpenAI input file ID
    batchId?: string; // OpenAI batch job ID
    outputFileId?: string; // OpenAI output file ID
    inputFile?: string;
    outputFile?: string;
    error?: string;
    processedCount?: number;
    totalCount?: number;
    artifactId?: string; // GitHub artifact ID if stored
}

export interface OpenAIResponse {
    body?: {
        choices?: Array<{
            message?: {
                content?: string;
            };
        }>;
    };
}

export const ActivitySchema = z.object({
    name: z.string(),
    description: z.string(),
});

export type Activity = z.infer<typeof ActivitySchema>;

const GeographicFocus = z.enum(["Global", "Local", "National", "Regional"]);

export const WebsiteConfirmationSchema = z.object({
    hasCorrectWebsite: z.boolean().describe("Whether the model determined the provided URL is the correct website"),
    correctWebsiteUrl: z.string().nullable().describe("The correct website URL if found, otherwise null"),
    reasoning: z.string().describe("Explanation of how the correct website was identified or why none matched"),
    organizationOneSentenceSummary: z.string().nullable().describe("A brief summary of the organization"),
    whySupportOrganization: z.string().nullable().describe("Why one should consider supporting the organization"),
    organizationMission: z.string().nullable().describe("The mission statement of the organization"),
    organizationTagline: z.string().nullable().describe("A tagline or slogan of the organization"),
    organizationUniqueTrait: z.string().nullable().describe("What makes the organization unique"),
    organizationTargetAudience: z.string().nullable().describe("The primary audience the organization serves"),
    organizationGeographicFocus: GeographicFocus.nullable().describe("Geographic focus: Global/Regional/National/Local"),
    organizationActivities: z
        .array(ActivitySchema)
        .nullable()
        .describe("Key organizational activities (name and description)"),
    organizationKeywords: z
        .array(z.string())
        .nullable()
        .describe("Key words or tags that give quick insight into the organization"),
});

export type WebsiteConfirmation = z.infer<typeof WebsiteConfirmationSchema>;
