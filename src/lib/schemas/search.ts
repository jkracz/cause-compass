import * as z from "zod";

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
  pagemap: z.record(z.string(), z.any()),
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

// Export types
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SocialMediaUrls = z.infer<typeof SocialMediaUrlsSchema>;
export type CrawlItem = z.infer<typeof CrawlItemSchema>;
export type BatchJob = z.infer<typeof BatchJobSchema>;
