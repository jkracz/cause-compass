import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Unified bucket validator for assets and income (annual USD)
const amountBucketValidator = v.union(
  v.literal("micro"), // < $50K
  v.literal("small"), // $50K - $250K
  v.literal("mid"), // $250K - $1M
  v.literal("large"), // $1M - $10M
  v.literal("mega"), // > $10M
  v.literal("unknown"), // null / missing
);

const enrichmentStageValidator = v.union(
  v.literal("created"),
  v.literal("searched"),
  v.literal("crawled"),
  v.literal("ai_confirmed"),
  v.literal("ready"),
);

const geographicFocusValidator = v.union(
  v.literal("Global"),
  v.literal("National"),
  v.literal("Regional"),
  v.literal("Local"),
);

const activityValidator = v.object({
  name: v.string(),
  description: v.string(),
});

const socialMediaUrlsValidator = v.object({
  linkedin: v.optional(v.string()),
  youtube: v.optional(v.string()),
  x: v.optional(v.string()),
  instagram: v.optional(v.string()),
  threads: v.optional(v.string()),
  facebook: v.optional(v.string()),
  twitter: v.optional(v.string()),
});

export default defineSchema({
  // Existing users table
  users: defineTable({
    userId: v.string(),
    preferences: v.object({
      causes: v.optional(v.array(v.string())),
      helpMethod: v.optional(v.array(v.string())),
      changeScope: v.optional(v.string()),
      location: v.optional(v.string()),
      openEnded: v.optional(
        v.object({
          question: v.string(),
          answer: v.optional(v.string()),
        }),
      ),
    }),
    likedOrganizations: v.array(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_likedOrganizations", ["likedOrganizations"]),

  organizations: defineTable({
    // Core identifiers
    ein: v.string(),
    name: v.string(),
    slug: v.string(),

    // Timestamps
    updatedAt: v.optional(v.number()),

    // Location
    street: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    ico: v.optional(v.string()), // In Care of Name

    // Classification
    nteeCode: v.optional(v.string()), // e.g., "A65"
    nteeMajor: v.optional(v.string()), // e.g., "A" (first char of nteeCode)
    activityCodes: v.optional(v.array(v.string())),
    classification: v.optional(v.string()), // Classification code(s)
    deductibilityCode: v.optional(v.string()),

    // IRS codes (reference data dictionaries for descriptions)
    subsection: v.optional(v.string()), // Subsection code
    affiliation: v.optional(v.string()), // Affiliation code
    ruling: v.optional(v.string()), // Ruling date
    groupExemption: v.optional(v.string()), // Group Exemption Number
    statusCode: v.optional(v.string()), // EO Status Code
    organizationCode: v.optional(v.string()), // Organization Code
    foundationCode: v.optional(v.string()), // Foundation Code

    // Financials (bucketed for filtering)
    assetBucket: amountBucketValidator,
    incomeBucket: amountBucketValidator,

    // AI-enriched fields
    websiteUrl: v.optional(v.string()),
    mission: v.optional(v.string()),
    tagline: v.optional(v.string()),
    oneSentenceSummary: v.optional(v.string()),
    whySupport: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    geographicFocus: v.optional(geographicFocusValidator),
    activities: v.optional(v.array(activityValidator)),
    keywords: v.optional(v.array(v.string())),
    socialMediaUrls: v.optional(socialMediaUrlsValidator),
    donationUrl: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    emailAddresses: v.optional(v.array(v.string())),

    // Workflow status
    enrichmentStage: enrichmentStageValidator,
  })
    .index("by_ein", ["ein"])
    .index("by_slug", ["slug"])
    .index("by_state", ["state"])
    .index("by_nteeMajor", ["nteeMajor"])
    .index("by_enrichmentStage", ["enrichmentStage"])
    .index("by_geographicFocus", ["geographicFocus"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["enrichmentStage"],
    }),

  searchResults: defineTable({
    ein: v.string(), // For linking to organizations
    orgId: v.optional(v.id("organizations")), // Set by post-import migration
    query: v.string(), // Search query used
    runAt: v.string(), // ISO timestamp
    resultsJson: v.string(), // JSON-stringified search results (raw objects have invalid field names like "theme-color")
  })
    .index("by_ein", ["ein"])
    .index("by_orgId", ["orgId"]),

  // Crawl results table (workflow input)
  crawlResults: defineTable({
    ein: v.string(), // For linking to organizations
    orgId: v.optional(v.id("organizations")), // Set by post-import migration
    sourceUrl: v.string(),
    runAt: v.string(),

    // Crawled content
    textContent: v.optional(v.string()),
    aboutLinks: v.optional(v.array(v.string())),
    donationLinks: v.optional(v.array(v.string())),
    socialMediaUrls: v.optional(v.array(v.string())),
    logoLinks: v.optional(v.array(v.string())),
    hasNewsletterSignup: v.optional(v.boolean()),
    emailAddresses: v.optional(v.array(v.string())),
  })
    .index("by_ein", ["ein"])
    .index("by_orgId", ["orgId"]),

  // AI confirmations table (workflow output + provenance)
  aiConfirmations: defineTable({
    ein: v.string(), // For linking to organizations
    orgId: v.optional(v.id("organizations")), // Set by post-import migration
    model: v.string(), // e.g., "gpt-4o-mini-2024-07-18"
    runAt: v.string(), // ISO timestamp

    // Input references (set by post-import migration)
    inputs: v.object({
      searchResultIds: v.optional(v.array(v.id("searchResults"))),
      crawlResultIds: v.optional(v.array(v.id("crawlResults"))),
    }),

    // AI outputs
    outputs: v.object({
      hasCorrectWebsite: v.boolean(),
      correctWebsiteUrl: v.optional(v.string()),
      mission: v.optional(v.string()),
      tagline: v.optional(v.string()),
      oneSentenceSummary: v.optional(v.string()),
      whySupport: v.optional(v.string()),
      targetAudience: v.optional(v.string()),
      geographicFocus: v.optional(v.string()),
      activityTags: v.optional(v.array(activityValidator)),
      reasoning: v.optional(v.string()),
    }),
  })
    .index("by_ein", ["ein"])
    .index("by_orgId", ["orgId"]),

  // Batch jobs table - audit log for OpenAI batch processing
  // Orchestration is handled by the workflow component; this table tracks results
  batchJobs: defineTable({
    // Job identifier
    jobId: v.string(),

    // Simplified status (workflow handles orchestration)
    status: v.union(
      v.literal("processing"), // Submitted to OpenAI, workflow waiting
      v.literal("completed"), // Successfully processed
      v.literal("failed"), // Failed
    ),

    // Timestamps
    createdAt: v.string(),
    completedAt: v.optional(v.string()),

    // Batch info
    batchSize: v.number(),

    // OpenAI references
    batchId: v.optional(v.string()), // OpenAI batch job ID
    outputFileId: v.optional(v.string()), // OpenAI output file ID

    // Results
    processedCount: v.optional(v.number()),
    errorCount: v.optional(v.number()),
    error: v.optional(v.string()),

    // Workflow integration
    workflowId: v.optional(v.string()),
  })
    .index("by_jobId", ["jobId"])
    .index("by_batchId", ["batchId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),
});
