import * as z from "zod/v4";

// Activity Code Schema
export const ActivityCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  category: z.string(),
});

// Asset Code Schema
export const AssetCodeSchema = z.object({
  code: z.string(),
  lowerLimit: z.number(),
  upperLimit: z.number().nullable().optional(),
});

// Affiliation Code Schema
export const AffiliationCodeSchema = z.object({
  code: z.string(),
  code_name: z.string(),
  description: z.string(),
});

// Deductibility Code Schema
export const DeductibilityCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
});

// EO Status Code Schema
export const EOStatusCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
});

// Organization Code Schema
export const OrgCodeSchema = z.object({
  code: z.string(),
  type: z.string(),
});

// Foundation Code Schema
export const FoundationCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
});

// Filing Requirement Code Schema
export const FilingRequirementCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  form_number: z.string(),
});

// NTEE Major Code Schema
export const NteeMajorCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  title: z.string(),
});

// NTEE Code Schema
export const NteeCodeSchema = z.object({
  code: z.string(),
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  majorCode: NteeMajorCodeSchema,
});

// Google Search API Key Type Enum
export const GoogleSearchApiKeyTypeSchema = z.enum([
  "CC",
  "PERSONAL",
  "JKRACZ",
  "SF",
  "JK",
]);
// Export types
export type ActivityCode = z.infer<typeof ActivityCodeSchema>;
export type AssetCode = z.infer<typeof AssetCodeSchema>;
export type AffiliationCode = z.infer<typeof AffiliationCodeSchema>;
export type DeductibilityCode = z.infer<typeof DeductibilityCodeSchema>;
export type EOStatusCode = z.infer<typeof EOStatusCodeSchema>;
export type OrgCode = z.infer<typeof OrgCodeSchema>;
export type FoundationCode = z.infer<typeof FoundationCodeSchema>;
export type FilingRequirementCode = z.infer<typeof FilingRequirementCodeSchema>;
export type NteeMajorCode = z.infer<typeof NteeMajorCodeSchema>;
export type NteeCode = z.infer<typeof NteeCodeSchema>;
export type GoogleSearchApiKeyType = z.infer<
  typeof GoogleSearchApiKeyTypeSchema
>;
