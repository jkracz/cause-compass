import * as z from "zod";

import { ActivitySchema } from "./activity";

// Search Result Schema
export const SearchResultSchema = z.object({
  kind: z.string(),
  title: z.string(),
  htmlTitle: z.string(),
  link: z.string(),
  displayLink: z.string(),
  snippet: z.string(),
  htmlSnippet: z.string(),
  formattedUrl: z.string(),
  htmlFormattedUrl: z.string(),
  pagemap: z.record(z.string(), z.any()).optional(),
});

// Social Media URLs Schema
export const SocialMediaUrlsSchema = z.object({
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
  x: z.string().optional(),
  instagram: z.string().optional(),
  threads: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
});

// Crawl Item Schema
export const CrawlItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  textContent: z.string(),
  socialMediaUrls: z.array(z.string()).optional(),
  hasNewsletterSignup: z.boolean().optional(),
  donationLinks: z.array(z.string()).optional(),
  emailAddresses: z.array(z.string()).optional(),
  logoLinks: z.array(z.string()).optional(),
  aboutLinks: z.array(z.string()).optional(),
});

// Batch Job Schema
export const BatchJobSchema = z.object({
  id: z.string(),
  status: z.enum([
    "pending",
    "generating",
    "uploading",
    "processing",
    "downloading",
    "completed",
    "failed",
  ]),
  createdAt: z.string(),
  updatedAt: z.string(),
  batchSize: z.number(),
  fileId: z.string().optional(), // OpenAI input file ID
  batchId: z.string().optional(), // OpenAI batch job ID
  outputFileId: z.string().optional(), // OpenAI output file ID
  inputFile: z.string().optional(),
  outputFile: z.string().optional(),
  error: z.string().optional(),
  processedCount: z.number().optional(),
  totalCount: z.number().optional(),
  artifactId: z.string().optional(), // GitHub artifact ID if stored
});

const GeographicFocus = z.enum(["Global", "Local", "National", "Regional"]);

export const WebsiteConfirmationSchema = z.object({
  hasCorrectWebsite: z
    .boolean()
    .describe(
      "Whether the model determined the provided URL is the correct website",
    ),
  correctWebsiteUrl: z
    .string()
    .nullable()
    .describe("The correct website URL if found, otherwise null"),
  reasoning: z
    .string()
    .describe(
      "Explanation of how the correct website was identified or why none matched",
    ),
  organizationOneSentenceSummary: z
    .string()
    .nullable()
    .describe("A brief summary of the organization"),
  whySupportOrganization: z
    .string()
    .nullable()
    .describe("Why one should consider supporting the organization"),
  organizationMission: z
    .string()
    .nullable()
    .describe("The mission statement of the organization"),
  organizationTagline: z
    .string()
    .nullable()
    .describe("A tagline or slogan of the organization"),
  organizationUniqueTrait: z
    .string()
    .nullable()
    .describe("What makes the organization unique"),
  organizationTargetAudience: z
    .string()
    .nullable()
    .describe("The primary audience the organization serves"),
  organizationGeographicFocus: GeographicFocus.nullable().describe(
    "Geographic focus: Global/Regional/National/Local",
  ),
  organizationActivities: z
    .array(ActivitySchema)
    .nullable()
    .describe("Key organizational activities (name and description)"),
  organizationKeywords: z
    .array(z.string())
    .nullable()
    .describe(
      "Key words or labels that give quick insight into what the organization does, who they help, and how they help",
    ),
});

export interface OpenAIResponse {
  body?: {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
}

// Export types
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SocialMediaUrls = z.infer<typeof SocialMediaUrlsSchema>;
export type CrawlItem = z.infer<typeof CrawlItemSchema>;
export type BatchJob = z.infer<typeof BatchJobSchema>;
export type WebsiteConfirmation = z.infer<typeof WebsiteConfirmationSchema>;
