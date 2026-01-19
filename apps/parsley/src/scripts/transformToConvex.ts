import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
import slugify from "slugify";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { logger } from "@/utils/logger";
import { truncateTextContent, MAX_TEXT_CONTENT_LENGTH, limitArrayBySize } from "@/utils/textUtils";
import type { TaxExemptOrganization, WebsiteConfirmation } from "@cause/types";
import { Doc } from "@cause/backend/convex/_generated/dataModel";

// Convex output types (only what's specific to Convex schema)
type AmountBucket =
  | "micro" // < $50K
  | "small" // $50K - $250K
  | "mid" // $250K - $1M
  | "large" // $1M - $10M
  | "mega" // > $10M
  | "unknown"; // null / missing

type EnrichmentStage =
  | "created"
  | "searched"
  | "crawled"
  | "ai_confirmed"
  | "ready";

type GeographicFocus = "Global" | "National" | "Regional" | "Local";

type SocialMediaUrls = {
  linkedin?: string;
  youtube?: string;
  x?: string;
  instagram?: string;
  threads?: string;
  facebook?: string;
  twitter?: string;
};

// Omit system fields (_id, _creationTime) for document creation
type ConvexOrganization = Omit<Doc<"organizations">, "_id" | "_creationTime">;

type ConvexSearchResult = Omit<Doc<"searchResults">, "_id" | "_creationTime">;

type ConvexCrawlResult = Omit<Doc<"crawlResults">, "_id" | "_creationTime">;

type ConvexAiConfirmation = Omit<
  Doc<"aiConfirmations">,
  "_id" | "_creationTime"
>;

// Transformation functions
function getAmountBucket(amount: number | null | undefined): AmountBucket {
  if (amount === null || amount === undefined) return "unknown";
  if (amount < 50_000) return "micro";
  if (amount < 250_000) return "small";
  if (amount < 1_000_000) return "mid";
  if (amount < 10_000_000) return "large";
  return "mega";
}

function getEnrichmentStage(doc: TaxExemptOrganization): EnrichmentStage {
  // Check for AI fields populated (indicates ready state)
  if (doc.mission || doc.websiteUrl || doc.oneSentenceSummary) {
    return "ready";
  }
  if (doc.aiConfirmationResponse) {
    return "ai_confirmed";
  }
  if (doc.confirmationCrawlItems && doc.confirmationCrawlItems.length > 0) {
    return "crawled";
  }
  if (doc.searchResults && doc.searchResults.length > 0) {
    return "searched";
  }
  return "created";
}

function parseGeographicFocus(
  value: string | null | undefined,
): GeographicFocus | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === "global") return "Global";
  if (normalized === "national") return "National";
  if (normalized === "regional") return "Regional";
  if (normalized === "local") return "Local";
  return undefined;
}

function parseAiResponse(
  response: TaxExemptOrganization["aiConfirmationResponse"],
): Partial<WebsiteConfirmation> | null {
  try {
    const content = response?.body?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      hasCorrectWebsite: parsed.hasCorrectWebsite ?? false,
      correctWebsiteUrl: parsed.correctWebsiteUrl,
      organizationMission: parsed.organizationMission,
      organizationTagline: parsed.organizationTagline,
      organizationOneSentenceSummary: parsed.oneSentenceOrganizationSummary,
      whySupportOrganization: parsed.whySupportOrganization,
      organizationTargetAudience: parsed.organizationTargetAudience,
      organizationGeographicFocus: parsed.organizationGeographicFocus,
      organizationActivities: parsed.organizationActivities,
      reasoning: parsed.reasoning,
    };
  } catch {
    return null;
  }
}

function extractModel(
  response: TaxExemptOrganization["aiConfirmationResponse"],
): string {
  return response?.body?.model ?? "unknown";
}

function generateSlug(name: string, ein: string): string {
  const slugified = slugify(name, { lower: true, strict: true });
  const lastFour = ein.slice(-4);
  return `${slugified}-${lastFour}`;
}

function extractActivityCodes(
  doc: TaxExemptOrganization,
): string[] | undefined {
  if (!doc.activityCodes || doc.activityCodes.length === 0) return undefined;
  return doc.activityCodes.map((ac) => ac.code);
}

function extractSocialMediaUrls(
  doc: TaxExemptOrganization,
): SocialMediaUrls | undefined {
  const social = doc.socialMediaUrls;
  if (!social) return undefined;

  const result: SocialMediaUrls = {};
  if (social.linkedin) result.linkedin = social.linkedin;
  if (social.youtube) result.youtube = social.youtube;
  if (social.x) result.x = social.x;
  if (social.instagram) result.instagram = social.instagram;
  if (social.threads) result.threads = social.threads;
  if (social.facebook) result.facebook = social.facebook;
  if (social.twitter) result.twitter = social.twitter;

  return Object.keys(result).length > 0 ? result : undefined;
}

function parseTimestamp(
  isoString: string | undefined | null,
): number | undefined {
  if (!isoString) return undefined;
  try {
    const timestamp = new Date(isoString).getTime();
    return isNaN(timestamp) ? undefined : timestamp;
  } catch {
    return undefined;
  }
}

interface TransformResult {
  organization: ConvexOrganization;
  searchResult: ConvexSearchResult | null;
  crawlResults: ConvexCrawlResult[];
  aiConfirmation: ConvexAiConfirmation | null;
  truncatedCrawlResults: number;
}

function transformDocument(doc: TaxExemptOrganization): TransformResult {
  const now = new Date().toISOString();
  const nowTimestamp = Date.now();

  // 1. Transform organization
  const organization: ConvexOrganization = {
    ein: doc.ein,
    name: doc.name,
    slug: doc.slug ?? generateSlug(doc.name, doc.ein),
    updatedAt:
      parseTimestamp(doc.lastUpdated) ??
      parseTimestamp(doc.createdAt) ??
      nowTimestamp,
    street: doc.street,
    city: doc.city,
    state: doc.state,
    zip: doc.zip,
    ico: doc.ico ?? undefined,
    // Classification
    nteeCode: doc.nteeCode?.code,
    nteeMajor: doc.nteeCode?.majorCode?.code,
    activityCodes: extractActivityCodes(doc),
    classification: doc.classification ?? undefined,
    deductibilityCode: doc.deductibility?.code,
    // IRS codes
    subsection: doc.subsection ?? undefined,
    affiliation: doc.affiliation?.code,
    ruling: doc.ruling ?? undefined,
    groupExemption: doc.group ?? undefined,
    statusCode: doc.status?.code,
    organizationCode: doc.organization?.code,
    foundationCode: doc.foundation?.code,
    // Financials
    assetBucket: getAmountBucket(doc.assetAmt),
    incomeBucket: getAmountBucket(doc.incomeAmt),
    enrichmentStage: getEnrichmentStage(doc),
    // AI-populated fields (if available)
    websiteUrl: doc.websiteUrl ?? undefined,
    mission: doc.mission ?? undefined,
    tagline: doc.tagline ?? undefined,
    oneSentenceSummary: doc.oneSentenceSummary ?? undefined,
    whySupport: doc.whySupport ?? undefined,
    targetAudience: doc.targetAudience ?? undefined,
    geographicFocus: parseGeographicFocus(doc.geographicFocus),
    activities: doc.activities ?? undefined,
    keywords: doc.keywords ?? undefined,
    socialMediaUrls: extractSocialMediaUrls(doc),
    donationUrl: doc.donationUrl ?? undefined,
    logoUrl: doc.logoUrl ?? undefined,
    emailAddresses: doc.emailAddresses ?? undefined,
  };

  // 2. Transform search results (if present)
  let searchResult: ConvexSearchResult | null = null;
  if (doc.searchResults && doc.searchResults.length > 0) {
    searchResult = {
      ein: doc.ein,
      query: `${doc.name} ${doc.city} ${doc.state} nonprofit`,
      runAt: doc.searchedAt ?? doc.createdAt ?? now,
      resultsJson: JSON.stringify(doc.searchResults), // Stringify to avoid invalid field names like "theme-color"
    };
  }

  // 3. Transform crawl results (if present)
  const crawlResults: ConvexCrawlResult[] = [];
  let truncatedCrawlResults = 0;
  if (doc.confirmationCrawlItems && doc.confirmationCrawlItems.length > 0) {
    for (const item of doc.confirmationCrawlItems) {
      // Helper to filter and validate string arrays
      const cleanStringArray = (
        arr: unknown[] | undefined | null,
      ): string[] | undefined => {
        if (!arr || !Array.isArray(arr)) return undefined;
        const cleaned = arr.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        );
        return cleaned.length > 0 ? cleaned : undefined;
      };

      // Track if content was truncated
      const originalLength = item.textContent?.length ?? 0;
      if (originalLength > MAX_TEXT_CONTENT_LENGTH) {
        truncatedCrawlResults++;
      }

      crawlResults.push({
        ein: doc.ein,
        sourceUrl: item.url,
        runAt: doc.resultsParsedAt ?? doc.searchedAt ?? now,
        textContent: truncateTextContent(item.textContent),
        aboutLinks: limitArrayBySize(cleanStringArray(item.aboutLinks)),
        donationLinks: limitArrayBySize(cleanStringArray(item.donationLinks)),
        socialMediaUrls: limitArrayBySize(cleanStringArray(item.socialMediaUrls)),
        logoLinks: limitArrayBySize(cleanStringArray(item.logoLinks)),
        hasNewsletterSignup: item.hasNewsletterSignup,
        emailAddresses: limitArrayBySize(cleanStringArray(item.emailAddresses)),
      });
    }
  }

  // 4. Transform AI confirmation (if present)
  let aiConfirmation: ConvexAiConfirmation | null = null;
  if (doc.aiConfirmationResponse) {
    const parsed = parseAiResponse(doc.aiConfirmationResponse);
    if (parsed) {
      aiConfirmation = {
        ein: doc.ein,
        model: extractModel(doc.aiConfirmationResponse),
        runAt: doc.lastUpdated ?? doc.resultsParsedAt ?? now,
        inputs: {},
        outputs: {
          hasCorrectWebsite: parsed.hasCorrectWebsite ?? false,
          correctWebsiteUrl: parsed.correctWebsiteUrl ?? undefined,
          mission: parsed.organizationMission ?? undefined,
          tagline: parsed.organizationTagline ?? undefined,
          oneSentenceSummary:
            parsed.organizationOneSentenceSummary ?? undefined,
          whySupport: parsed.whySupportOrganization ?? undefined,
          targetAudience: parsed.organizationTargetAudience ?? undefined,
          geographicFocus: parsed.organizationGeographicFocus ?? undefined,
          activityTags: parsed.organizationActivities ?? undefined,
          reasoning: parsed.reasoning ?? undefined,
        },
      };
    }
  }

  return { organization, searchResult, crawlResults, aiConfirmation, truncatedCrawlResults };
}

// Utility to remove undefined values (Convex doesn't like undefined)
function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

async function parseLimit(): Promise<number | undefined> {
  const argv = await yargs(hideBin(process.argv)).argv;
  const limit = argv.limit as number | undefined;
  if (limit) {
    return limit;
  }
  return undefined;
}

async function main() {
  const limit = await parseLimit();
  const inputFile = path.resolve(
    __dirname,
    "../../data/raw/organizations.jsonl",
  );
  const outputDir = path.resolve(__dirname, "../../data/convex-import");

  logger.info(`Starting Convex transformation`);
  logger.info(`Input file: ${inputFile}`);
  logger.info(`Output directory: ${outputDir}`);
  if (limit) {
    logger.info(`Processing limit: ${limit} organizations`);
  }

  // Ensure output directory exists
  await fs.promises.mkdir(outputDir, { recursive: true });

  // Create write streams for each output file
  const orgStream = fs.createWriteStream(
    path.join(outputDir, "organizations.jsonl"),
  );
  const searchStream = fs.createWriteStream(
    path.join(outputDir, "searchResults.jsonl"),
  );
  const crawlStream = fs.createWriteStream(
    path.join(outputDir, "crawlResults.jsonl"),
  );
  const aiStream = fs.createWriteStream(
    path.join(outputDir, "aiConfirmations.jsonl"),
  );

  // Process input file line by line (memory efficient for 198K records)
  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile),
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  let orgCount = 0;
  let searchCount = 0;
  let crawlCount = 0;
  let aiCount = 0;
  let errorCount = 0;
  let truncatedCount = 0;

  // Track enrichment stage distribution
  const stageCounts: Record<EnrichmentStage, number> = {
    created: 0,
    searched: 0,
    crawled: 0,
    ai_confirmed: 0,
    ready: 0,
  };

  for await (const line of rl) {
    lineCount++;
    if (lineCount % 10000 === 0) {
      logger.info(`Processed ${lineCount} lines...`);
    }

    try {
      const doc = JSON.parse(line) as TaxExemptOrganization;
      const result = transformDocument(doc);

      // Track enrichment stage
      stageCounts[result.organization.enrichmentStage]++;

      // Track truncated crawl results
      truncatedCount += result.truncatedCrawlResults;

      // Write organization (clean undefined values)
      orgStream.write(
        JSON.stringify(cleanUndefined(result.organization)) + "\n",
      );
      orgCount++;

      // Write search result if present
      if (result.searchResult) {
        searchStream.write(
          JSON.stringify(cleanUndefined(result.searchResult)) + "\n",
        );
        searchCount++;
      }

      // Write crawl results if present
      for (const crawl of result.crawlResults) {
        crawlStream.write(JSON.stringify(cleanUndefined(crawl)) + "\n");
        crawlCount++;
      }

      // Write AI confirmation if present
      if (result.aiConfirmation) {
        aiStream.write(
          JSON.stringify(cleanUndefined(result.aiConfirmation)) + "\n",
        );
        aiCount++;
      }

      // Check if we've reached the limit
      if (limit && orgCount >= limit) {
        logger.info(`Reached processing limit of ${limit} organizations`);
        break;
      }
    } catch (error) {
      errorCount++;
      logger.error(`Error processing line ${lineCount}: ${error}`);
    }
  }

  // Close streams
  await Promise.all([
    new Promise((resolve) => orgStream.end(resolve)),
    new Promise((resolve) => searchStream.end(resolve)),
    new Promise((resolve) => crawlStream.end(resolve)),
    new Promise((resolve) => aiStream.end(resolve)),
  ]);

  logger.info("\n=== Transformation Complete ===");
  logger.info(`Total lines processed: ${lineCount}`);
  logger.info(`Errors: ${errorCount}`);
  logger.info("");
  logger.info("Output counts:");
  logger.info(`  Organizations: ${orgCount}`);
  logger.info(`  Search Results: ${searchCount}`);
  logger.info(`  Crawl Results: ${crawlCount}`);
  logger.info(`  AI Confirmations: ${aiCount}`);
  if (truncatedCount > 0) {
    logger.info(`  Crawl Results Truncated: ${truncatedCount} (textContent exceeded ${MAX_TEXT_CONTENT_LENGTH} chars)`);
  }
  logger.info("");
  logger.info("Enrichment stage distribution:");
  logger.info(`  created: ${stageCounts.created}`);
  logger.info(`  searched: ${stageCounts.searched}`);
  logger.info(`  crawled: ${stageCounts.crawled}`);
  logger.info(`  ai_confirmed: ${stageCounts.ai_confirmed}`);
  logger.info(`  ready: ${stageCounts.ready}`);
  logger.info("");
  logger.info(`Output files written to: ${outputDir}`);
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
