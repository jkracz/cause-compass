import slugify from "slugify";
import type { TaxExemptOrganization } from "@cause/types";
import type { Doc } from "@cause/backend/convex/_generated/dataModel";

// Convex amount bucket types (annual USD)
export type AmountBucket =
  | "micro" // < $50K
  | "small" // $50K - $250K
  | "mid" // $250K - $1M
  | "large" // $1M - $10M
  | "mega" // > $10M
  | "unknown"; // null / missing

export type EnrichmentStage =
  | "created"
  | "searched"
  | "crawled"
  | "ai_confirmed"
  | "ready";

export type GeographicFocus = "Global" | "National" | "Regional" | "Local";

export type SocialMediaUrls = {
  linkedin?: string;
  youtube?: string;
  x?: string;
  instagram?: string;
  threads?: string;
  facebook?: string;
  twitter?: string;
};

// Omit system fields (_id, _creationTime) for document creation
export type ConvexOrganization = Omit<
  Doc<"organizations">,
  "_id" | "_creationTime"
>;

export type ConvexSearchResult = Omit<
  Doc<"searchResults">,
  "_id" | "_creationTime"
>;

export type ConvexCrawlResult = Omit<
  Doc<"crawlResults">,
  "_id" | "_creationTime"
>;

export type ConvexAiConfirmation = Omit<
  Doc<"aiConfirmations">,
  "_id" | "_creationTime"
>;

/**
 * Converts an amount to a bucket category for Convex.
 */
export function getAmountBucket(
  amount: number | null | undefined,
): AmountBucket {
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
export function generateSlug(name: string, ein: string): string {
  const slugified = slugify(name, { lower: true, strict: true });
  const lastFour = ein.slice(-4);
  return `${slugified}-${lastFour}`;
}

/**
 * Extracts activity code strings from the activity code objects.
 */
export function extractActivityCodes(
  doc: TaxExemptOrganization,
): string[] | undefined {
  if (!doc.activityCodes || doc.activityCodes.length === 0) return undefined;
  return doc.activityCodes.map((ac) => ac.code);
}

/**
 * Removes undefined values from an object (Convex doesn't accept undefined).
 */
export function cleanUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}
