import { z } from 'zod';
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
} from './codes';
import {
  SearchResultSchema,
  SocialMediaUrlsSchema,
  CrawlItemSchema,
} from './search';

// MongoDB ObjectId Schema (for compatibility)
export const ObjectIdSchema = z.union([
  z.string(), // MongoDB ObjectId as string
  z.object({}).passthrough(), // Allow ObjectId object to pass through
]);

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
  ico: z.string().optional(), // In Care of Name
  street: z.string(), // Street Address  
  city: z.string(), // City
  state: z.string(), // State
  zip: z.string(), // Zip Code
  group: z.string().optional(), // Group Exemption Number
  
  // Tax/Legal Classification
  subsection: z.string(), // Subsection Code
  affiliation: AffiliationCodeSchema, // Affiliation Code
  classification: z.string(), // Classification Code(s)
  ruling: z.string(), // Ruling Date
  deductibility: DeductibilityCodeSchema, // Deductibility Code
  foundation: FoundationCodeSchema, // Foundation Code
  activityCodes: z.array(ActivityCodeSchema).optional(), // Activity Codes
  organization: OrgCodeSchema, // Organization Code
  status: EOStatusCodeSchema, // Exempt Organization Status Code
  
  // Financial Info
  taxPeriod: z.string().optional(), // Tax Period
  assetCode: AssetCodeSchema, // Asset Code
  incomeCode: z.string(), // Income Code
  filingReqCode: FilingRequirementCodeSchema, // Filing Requirement Code
  pfFilingReqCode: FilingRequirementCodeSchema.optional(), // PF Filing Requirement Code
  acctPeriod: z.string(), // Accounting Period
  assetAmt: z.number().optional(), // Asset Amount
  incomeAmt: z.number().optional(), // Income Amount
  revenueAmt: z.number().optional(), // Revenue Amount
  
  // NTEE Classification
  nteeCode: NteeCodeSchema.optional(), // NTEE Code
  sortName: z.string().optional(), // Sort Name (Secondary Name Line)
  
  // Search/Crawl Data
  searchResults: z.array(SearchResultSchema).optional(),
  searchKey: GoogleSearchApiKeyTypeSchema.optional(),
  resultsParsedAt: z.string().optional(),
  confirmationCrawlItems: z.array(CrawlItemSchema).optional(),
  aiConfirmationResponse: z.any().optional(),
  
  // Organization Details
  socialMediaUrls: SocialMediaUrlsSchema.optional(),
  donationUrl: z.string().optional(),
  emailAddresses: z.array(z.string()).optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
});

// Create input schema (for creating new organizations - without optional DB fields)
export const CreateTaxExemptOrganizationSchema = TaxExemptOrganizationSchema.omit({
  _id: true,
  dbId: true,
  createdAt: true,
  lastUpdated: true,
  searchedAt: true,
  resultsParsedAt: true,
});

// Update schema (all fields optional except required ones)
export const UpdateTaxExemptOrganizationSchema = TaxExemptOrganizationSchema.partial().merge(
  z.object({
    ein: z.string(), // EIN should always be required for updates
  })
);

// Export types
export type TaxExemptOrganization = z.infer<typeof TaxExemptOrganizationSchema>;
export type CreateTaxExemptOrganization = z.infer<typeof CreateTaxExemptOrganizationSchema>;
export type UpdateTaxExemptOrganization = z.infer<typeof UpdateTaxExemptOrganizationSchema>; 