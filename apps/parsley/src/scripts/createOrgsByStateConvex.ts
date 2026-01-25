import { parseEoFile } from "../services/parseEoFile";
import * as fs from "fs";
import * as path from "path";
import slugify from "slugify";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { logger } from "@/utils/logger";
import type { TaxExemptOrganization } from "@cause/types";
import type { Doc } from "@cause/backend/convex/_generated/dataModel";

// Configuration constants
const DATA_DIR = "data";

// Convex types
type AmountBucket =
  | "micro" // < $50K
  | "small" // $50K - $250K
  | "mid" // $250K - $1M
  | "large" // $1M - $10M
  | "mega" // > $10M
  | "unknown"; // null / missing

type EnrichmentStage = "created";

// Omit system fields (_id, _creationTime) for document creation
type ConvexOrganization = Omit<Doc<"organizations">, "_id" | "_creationTime">;

/**
 * Determines if a tax-exempt organization meets the criteria for insertion into the database.
 * Filters out organizations that are:
 * - Not deductible (deductibility code !== "1")
 * - Religious organizations (activity codes containing "Religious Activities")
 * - Government affiliates (affiliation code === "9")
 * - Organizations with specific filing requirement codes (06, 13, 14, 00)
 * - Private foundations (foundation codes 02, 03, 04, 10)
 * - Organizations with specific status codes (12, 25)
 */
const meetsCriteria = (eo: TaxExemptOrganization): boolean => {
  const {
    deductibility,
    activityCodes,
    affiliation,
    filingReqCode,
    foundation,
    status,
  } = eo;

  if (!deductibility || deductibility.code !== "1") {
    return false;
  }

  if (activityCodes?.some((code) => code.category === "Religious Activities")) {
    return false;
  }

  if (affiliation.code === "9") {
    return false;
  }

  if (!filingReqCode || ["06", "13", "14", "00"].includes(filingReqCode.code)) {
    return false;
  }

  const foundationCode = foundation?.code;
  if (!foundationCode || ["02", "03", "04", "10"].includes(foundationCode)) {
    return false;
  }

  if (!status || ["12", "25"].includes(status.code)) {
    return false;
  }

  return true;
};

/**
 * Converts an amount to a bucket category for Convex.
 */
function getAmountBucket(amount: number | null | undefined): AmountBucket {
  if (amount === null || amount === undefined) return "unknown";
  if (amount < 50_000) return "micro";
  if (amount < 250_000) return "small";
  if (amount < 1_000_000) return "mid";
  if (amount < 10_000_000) return "large";
  return "mega";
}

/**
 * Generates a URL-friendly slug from organization name and EIN.
 */
function generateSlug(name: string, ein: string): string {
  const slugified = slugify(name, { lower: true, strict: true });
  const lastFour = ein.slice(-4);
  return `${slugified}-${lastFour}`;
}

/**
 * Extracts activity code strings from the activity code objects.
 */
function extractActivityCodes(
  doc: TaxExemptOrganization,
): string[] | undefined {
  if (!doc.activityCodes || doc.activityCodes.length === 0) return undefined;
  return doc.activityCodes.map((ac) => ac.code);
}

/**
 * Transforms a TaxExemptOrganization to Convex organization format.
 * Only includes base organization data - no search results, crawl items, or AI confirmations.
 */
function transformToConvexOrg(doc: TaxExemptOrganization): ConvexOrganization {
  const nowTimestamp = Date.now();

  return {
    // Core identifiers
    ein: doc.ein,
    name: doc.name,
    slug: generateSlug(doc.name, doc.ein),

    // Timestamps
    updatedAt: nowTimestamp,

    // Location
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

    // Financials (bucketed for filtering)
    assetBucket: getAmountBucket(doc.assetAmt),
    incomeBucket: getAmountBucket(doc.incomeAmt),

    // Workflow status - new orgs start at "created"
    enrichmentStage: "created" as EnrichmentStage,

    // AI-enriched fields are undefined for new imports
    websiteUrl: undefined,
    mission: undefined,
    tagline: undefined,
    oneSentenceSummary: undefined,
    whySupport: undefined,
    targetAudience: undefined,
    geographicFocus: undefined,
    activities: undefined,
    keywords: undefined,
    socialMediaUrls: undefined,
    donationUrl: undefined,
    logoUrl: undefined,
    emailAddresses: undefined,
  };
}

/**
 * Removes undefined values from an object (Convex doesn't accept undefined).
 */
function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

/**
 * Processes tax-exempt organization data for a specific state and outputs
 * a JSONL file suitable for Convex import.
 *
 * This script:
 * 1. Parses CSV data from the IRS EO (Exempt Organizations) file for the specified state
 * 2. Filters organizations based on predefined criteria
 * 3. Transforms qualifying organizations to Convex format
 * 4. Outputs a JSONL file for Convex CLI import
 *
 * @param state - The state abbreviation (e.g., "CA", "NY") to process
 */
const createOrgsByStateConvex = async (state: string) => {
  try {
    const stateUpper = state.toUpperCase();
    const stateLower = state.toLowerCase();

    // Parse the profiles from the EO file for the specified state
    const fileName = `eo_${stateLower}.csv`;
    logger.info(`Parsing EO file: ${fileName}`);

    const parsedProfiles: Record<string, TaxExemptOrganization> =
      await parseEoFile(fileName);

    // Initialize metrics
    let totalParsed = 0;
    let totalIncluded = 0;
    let totalExcluded = 0;

    // Create output directory if it doesn't exist
    const outputDir = path.resolve(__dirname, `../../${DATA_DIR}/convex-import`);
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Output file path
    const outputFile = path.join(outputDir, `organizations_${stateLower}.jsonl`);
    const writeStream = fs.createWriteStream(outputFile);

    // Process each organization
    for (const ein in parsedProfiles) {
      const profile = parsedProfiles[ein];
      if (!profile) {
        continue;
      }
      totalParsed++;

      // Apply filtering criteria
      if (meetsCriteria(profile)) {
        const convexOrg = transformToConvexOrg(profile);
        writeStream.write(JSON.stringify(cleanUndefined(convexOrg)) + "\n");
        totalIncluded++;
      } else {
        totalExcluded++;
      }
    }

    // Close the write stream
    await new Promise<void>((resolve) => writeStream.end(resolve));

    // Log results
    logger.info(`\n=== Processing Complete for ${stateUpper} ===`);
    logger.info(`Total profiles parsed: ${totalParsed}`);
    logger.info(`Profiles included (met criteria): ${totalIncluded}`);
    logger.info(`Profiles excluded (did not meet criteria): ${totalExcluded}`);
    logger.info(`\nOutput file: ${outputFile}`);
    logger.info(`\nTo import into Convex, run:`);
    logger.info(
      `  npx convex import --table organizations ${outputFile} --append`,
    );
  } catch (error) {
    logger.error(`Error processing ${state} profiles:`, error);
    process.exit(1);
  }
};

/**
 * Main entry point for the script.
 *
 * Usage: pnpm run create-profiles-convex --state=CA
 *
 * Requires a --state command line argument specifying the state to process.
 * The state should be provided as a two-letter abbreviation (e.g., "CA", "NY").
 */
const main = async () => {
  const argv = await yargs(hideBin(process.argv)).argv;
  const state = argv.state as string;

  if (state) {
    await createOrgsByStateConvex(state);
  } else {
    logger.error("Please provide a state using --state");
    logger.error("Example: pnpm run create-profiles-convex --state=CA");
    process.exit(1);
  }
};

main();
