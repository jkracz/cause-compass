import * as z from "zod";

import {
  ActivityCodeSchema,
  AssetCodeSchema,
  AffiliationCodeSchema,
  DeductibilityCodeSchema,
  EOStatusCodeSchema,
  OrgCodeSchema,
  FoundationCodeSchema,
  FilingRequirementCodeSchema,
  NteeCodeSchema,
  GoogleSearchApiKeyTypeSchema,
} from "./codes";
import {
  SearchResultSchema,
  SocialMediaUrlsSchema,
  CrawlItemSchema,
} from "./search";

// MongoDB ObjectId Schema (for compatibility)
export const ObjectIdSchema = z.union([
  z.string(), // MongoDB ObjectId as string
  z.object({}).passthrough(), // Allow ObjectId object to pass through
]);

export const ActivitySchema = z.object({
  name: z.string(),
  description: z.string(),
});

// Tax Exempt Organization Schema
export const TaxExemptOrganizationSchema = z.object({
  // MongoDB/Database fields
  createdAt: z.string().optional(),
  lastUpdated: z.string().optional(),
  searchedAt: z.string().optional(),
  _id: ObjectIdSchema.optional(),
  dbId: z.string().optional(),
  slug: z.string().optional(),

  // Core Organization Info
  ein: z.string(), // Employer Identification Number
  name: z.string(), // Primary Name of Organization
  ico: z.string().nullish(), // In Care of Name
  street: z.string(), // Street Address
  city: z.string(), // City
  state: z.string(), // State
  zip: z.string(), // Zip Code
  group: z.string().nullish(), // Group Exemption Number

  // Tax/Legal Classification
  subsection: z.string(), // Subsection Code
  affiliation: AffiliationCodeSchema, // Affiliation Code
  classification: z.string(), // Classification Code(s)
  ruling: z.string(), // Ruling Date
  deductibility: DeductibilityCodeSchema.nullish(), // Deductibility Code
  foundation: FoundationCodeSchema.nullish(), // Foundation Code
  activityCodes: z.array(ActivityCodeSchema).nullish(), // Activity Codes
  organization: OrgCodeSchema.nullish(), // Organization Code
  status: EOStatusCodeSchema, // Exempt Organization Status Code

  // Financial Info
  taxPeriod: z.string().nullish(), // Tax Period
  assetCode: AssetCodeSchema, // Asset Code
  incomeCode: z.string(), // Income Code
  filingReqCode: FilingRequirementCodeSchema, // Filing Requirement Code
  pfFilingReqCode: FilingRequirementCodeSchema.nullish(), // PF Filing Requirement Code
  acctPeriod: z.string(), // Accounting Period
  assetAmt: z.number().nullish(), // Asset Amount
  incomeAmt: z.number().nullish(), // Income Amount
  revenueAmt: z.number().nullish(), // Revenue Amount

  // NTEE Classification
  nteeCode: NteeCodeSchema.nullish(), // NTEE Code
  sortName: z.string().nullish(), // Sort Name (Secondary Name Line)

  // Search/Crawl Data
  searchResults: z.array(SearchResultSchema).optional(),
  searchKey: GoogleSearchApiKeyTypeSchema.optional(),
  resultsParsedAt: z.string().optional(),
  confirmationCrawlItems: z.array(CrawlItemSchema).optional(),
  aiConfirmationResponse: z.any().optional(),

  // Organization Details
  socialMediaUrls: SocialMediaUrlsSchema.nullish(),
  donationUrl: z.string().nullish(),
  emailAddresses: z.array(z.string()).nullish(),
  logoUrl: z.string().nullish(),
  websiteUrl: z.string().nullish(),
  oneSentenceSummary: z.string().nullish(),
  whySupport: z.string().nullish(),
  mission: z.string().nullish(),
  tagline: z.string().nullish(),
  uniqueTrait: z.string().nullish(),
  targetAudience: z.string().nullish(),
  geographicFocus: z.string().nullish(),
  keywords: z.array(z.string()).nullish(),
  activities: z.array(ActivitySchema).nullish(),
});

// Filters used for advanced org search
export const OrganizationSearchFiltersSchema = z.object({
  name: z.string().optional(),
  ein: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  nteeCode: z.string().optional(),
  nteeMajorCode: z.string().optional(),
  organizationType: z.string().optional(),
  assetAmtMin: z.number().optional(),
  assetAmtMax: z.number().optional(),
});

// Export types
export type TaxExemptOrganization = z.infer<typeof TaxExemptOrganizationSchema>;
export type OrganizationSearchFilters = z.infer<
  typeof OrganizationSearchFiltersSchema
>;
export type Activity = z.infer<typeof ActivitySchema>;
