/**
 * Temporary scraper regression test — compares old vs new crawl results.
 *
 * Usage:
 *   npx convex run comparison:compareResults '{"cutoffTimestamp": 1743000000000}'
 *
 * Delete this file after validation is complete.
 */

import { v } from "convex/values";
import { internalQuery, action } from "./_generated/server";
import { internal } from "./_generated/api";

// ── Internal query: fetch and split crawl results by cutoff ──

/**
 * Step 1: Get distinct EINs that have new crawl results (after cutoff).
 * Lightweight — only collects EIN strings, not full rows.
 */
export const getNewEins = internalQuery({
  args: { cutoffTimestamp: v.number() },
  handler: async (ctx, { cutoffTimestamp }) => {
    const einSet = new Set<string>();
    // Walk crawlResults created after cutoff using system _creationTime order
    let cursor: string | null = null;
    let done = false;
    while (!done) {
      const page = await ctx.db
        .query("crawlResults")
        .order("desc")
        .paginate({ numItems: 500, cursor: cursor as string | null });
      for (const row of page.page) {
        if (row._creationTime < cutoffTimestamp) {
          done = true;
          break;
        }
        einSet.add(row.ein);
      }
      if (page.isDone) done = true;
      cursor = page.continueCursor;
    }
    return [...einSet];
  },
});

/**
 * Step 2: For a batch of EINs, fetch all crawl results and split by cutoff.
 */
export const getComparisonDataForEins = internalQuery({
  args: { eins: v.array(v.string()), cutoffTimestamp: v.number() },
  handler: async (ctx, { eins, cutoffTimestamp }) => {
    const results: {
      ein: string;
      oldResults: {
        textContent?: string;
        aboutLinks?: string[];
        donationLinks?: string[];
        socialMediaUrls?: string[];
        logoLinks?: string[];
        emailAddresses?: string[];
        hasNewsletterSignup?: boolean;
        sourceUrl: string;
        crawlMethod?: "http" | "browser";
      }[];
      newResults: {
        textContent?: string;
        aboutLinks?: string[];
        donationLinks?: string[];
        socialMediaUrls?: string[];
        logoLinks?: string[];
        emailAddresses?: string[];
        hasNewsletterSignup?: boolean;
        sourceUrl: string;
        crawlMethod?: "http" | "browser";
      }[];
    }[] = [];

    for (const ein of eins) {
      const rows = await ctx.db
        .query("crawlResults")
        .withIndex("by_ein", (q) => q.eq("ein", ein))
        .collect();

      const oldRows = rows.filter((r) => r._creationTime < cutoffTimestamp);
      const newRows = rows.filter((r) => r._creationTime >= cutoffTimestamp);

      if (oldRows.length === 0 || newRows.length === 0) continue;

      const mapRow = (r: (typeof rows)[number]) => ({
        textContent: r.textContent,
        aboutLinks: r.aboutLinks,
        donationLinks: r.donationLinks,
        socialMediaUrls: r.socialMediaUrls,
        logoLinks: r.logoLinks,
        emailAddresses: r.emailAddresses,
        hasNewsletterSignup: r.hasNewsletterSignup,
        sourceUrl: r.sourceUrl,
        crawlMethod: r.crawlMethod,
      });

      results.push({
        ein,
        oldResults: oldRows.map(mapRow),
        newResults: newRows.map(mapRow),
      });
    }

    return results;
  },
});

// ── Aggregation helpers (mirror batch processor logic) ──

type CrawlRow = {
  textContent?: string;
  aboutLinks?: string[];
  donationLinks?: string[];
  socialMediaUrls?: string[];
  logoLinks?: string[];
  emailAddresses?: string[];
  hasNewsletterSignup?: boolean;
  sourceUrl: string;
  crawlMethod?: "http" | "browser";
};

interface AggregatedCohort {
  textContentTotalChars: number;
  textContentNonEmptyCount: number;
  resultCount: number;
  socialMediaUrls: string[];
  donationLinks: string[];
  logoLinks: string[];
  aboutLinks: string[];
  emailAddresses: string[];
  hasNewsletterSignup: boolean;
  sourceUrls: string[];
  crawlMethods: string[];
}

function aggregateCohort(results: CrawlRow[]): AggregatedCohort {
  let textContentTotalChars = 0;
  let textContentNonEmptyCount = 0;
  const socialMediaUrls: string[] = [];
  const donationLinks: string[] = [];
  const logoLinks: string[] = [];
  const aboutLinks: string[] = [];
  const emailSet = new Set<string>();
  let hasNewsletterSignup = false;

  for (const r of results) {
    // textContent — concatenated (mirroring AI confirmation prep)
    const tc = r.textContent ?? "";
    textContentTotalChars += tc.length;
    if (tc.length > 0) textContentNonEmptyCount++;

    // Array fields — union across results
    if (r.socialMediaUrls) socialMediaUrls.push(...r.socialMediaUrls);
    if (r.donationLinks) donationLinks.push(...r.donationLinks);
    if (r.logoLinks) logoLinks.push(...r.logoLinks);
    if (r.aboutLinks) aboutLinks.push(...r.aboutLinks);
    if (r.emailAddresses) r.emailAddresses.forEach((e) => emailSet.add(e));

    // Boolean — OR
    if (r.hasNewsletterSignup) hasNewsletterSignup = true;
  }

  return {
    textContentTotalChars,
    textContentNonEmptyCount,
    resultCount: results.length,
    socialMediaUrls: [...new Set(socialMediaUrls)],
    donationLinks: [...new Set(donationLinks)],
    logoLinks: [...new Set(logoLinks)],
    aboutLinks: [...new Set(aboutLinks)],
    emailAddresses: [...emailSet],
    hasNewsletterSignup,
    sourceUrls: results.map((r) => r.sourceUrl),
    crawlMethods: [...new Set(results.map((r) => r.crawlMethod ?? "unknown"))],
  };
}

// ── Comparison logic ──

interface FieldComparison {
  oldCount: number;
  newCount: number;
  delta: number;
  overlap: number;
  overlapRatio: number;
}

function compareArrayField(
  oldArr: string[],
  newArr: string[],
): FieldComparison {
  const oldSet = new Set(oldArr);
  const newSet = new Set(newArr);
  const overlap = [...oldSet].filter((x) => newSet.has(x)).length;
  const unionSize = new Set([...oldSet, ...newSet]).size;
  return {
    oldCount: oldSet.size,
    newCount: newSet.size,
    delta: newSet.size - oldSet.size,
    overlap,
    overlapRatio: unionSize > 0 ? overlap / unionSize : 1,
  };
}

interface EinComparison {
  ein: string;
  old: AggregatedCohort;
  new: AggregatedCohort;
  textContentLengthRatio: number;
  textContentRegression: boolean; // had content → empty
  socialMedia: FieldComparison;
  donationLinks: FieldComparison;
  logoLinks: FieldComparison;
  aboutLinks: FieldComparison;
  emailAddresses: FieldComparison;
  newsletterRegression: boolean;
}

function compareEin(
  ein: string,
  oldResults: CrawlRow[],
  newResults: CrawlRow[],
): EinComparison {
  const oldAgg = aggregateCohort(oldResults);
  const newAgg = aggregateCohort(newResults);

  return {
    ein,
    old: oldAgg,
    new: newAgg,
    textContentLengthRatio:
      oldAgg.textContentTotalChars > 0
        ? newAgg.textContentTotalChars / oldAgg.textContentTotalChars
        : newAgg.textContentTotalChars > 0
          ? Infinity
          : 1,
    textContentRegression:
      oldAgg.textContentTotalChars > 0 && newAgg.textContentTotalChars === 0,
    socialMedia: compareArrayField(
      oldAgg.socialMediaUrls,
      newAgg.socialMediaUrls,
    ),
    donationLinks: compareArrayField(
      oldAgg.donationLinks,
      newAgg.donationLinks,
    ),
    logoLinks: compareArrayField(oldAgg.logoLinks, newAgg.logoLinks),
    aboutLinks: compareArrayField(oldAgg.aboutLinks, newAgg.aboutLinks),
    emailAddresses: compareArrayField(
      oldAgg.emailAddresses,
      newAgg.emailAddresses,
    ),
    newsletterRegression:
      oldAgg.hasNewsletterSignup && !newAgg.hasNewsletterSignup,
  };
}

// ── Public action ──

export const compareResults = action({
  args: { cutoffTimestamp: v.number() },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, { cutoffTimestamp }): Promise<Record<string, any>> => {
    // Step 1: Get EINs with new results (after cutoff)
    const newEins: string[] = await ctx.runQuery(
      internal.comparison.getNewEins,
      { cutoffTimestamp },
    );

    if (newEins.length === 0) {
      return {
        error:
          "No crawl results found after the cutoff timestamp. " +
          "Check that the cutoff timestamp is correct.",
      };
    }

    // Step 2: Fetch comparison data in batches of 20 EINs
    const allData: {
      ein: string;
      oldResults: CrawlRow[];
      newResults: CrawlRow[];
    }[] = [];
    const BATCH_SIZE = 20;
    for (let i = 0; i < newEins.length; i += BATCH_SIZE) {
      const batch = newEins.slice(i, i + BATCH_SIZE);
      const batchData: typeof allData = await ctx.runQuery(
        internal.comparison.getComparisonDataForEins,
        { eins: batch, cutoffTimestamp },
      );
      allData.push(...batchData);
    }

    if (allData.length === 0) {
      return {
        error:
          "No EINs found with crawl results on BOTH sides of the cutoff. " +
          `Found ${newEins.length} EINs with new results, but none had old results.`,
      };
    }

    // Compare each EIN
    const comparisons: EinComparison[] = allData.map((d) =>
      compareEin(d.ein, d.oldResults, d.newResults),
    );

    // ── Summary stats ──
    const n: number = comparisons.length;
    const avgTextRatio: number =
      comparisons.reduce((s: number, c: EinComparison) => {
        // Exclude Infinity from average (old had nothing, new has something)
        return s + (c.textContentLengthRatio === Infinity ? 1 : c.textContentLengthRatio);
      }, 0) / n;

    const fieldCoverage = (
      oldAccessor: (c: EinComparison) => number,
      newAccessor: (c: EinComparison) => number,
    ) => ({
      oldCount: comparisons.filter((c) => oldAccessor(c) > 0).length,
      oldPct: Math.round(
        (comparisons.filter((c) => oldAccessor(c) > 0).length / n) * 100,
      ),
      newCount: comparisons.filter((c) => newAccessor(c) > 0).length,
      newPct: Math.round(
        (comparisons.filter((c) => newAccessor(c) > 0).length / n) * 100,
      ),
    });

    const summary = {
      totalOrgsCompared: n,
      avgTextContentLengthRatio: Math.round(avgTextRatio * 100) / 100,
      textContent: fieldCoverage(
        (c) => c.old.textContentTotalChars,
        (c) => c.new.textContentTotalChars,
      ),
      socialMedia: fieldCoverage(
        (c) => c.socialMedia.oldCount,
        (c) => c.socialMedia.newCount,
      ),
      donationLinks: fieldCoverage(
        (c) => c.donationLinks.oldCount,
        (c) => c.donationLinks.newCount,
      ),
      logoLinks: fieldCoverage(
        (c) => c.logoLinks.oldCount,
        (c) => c.logoLinks.newCount,
      ),
      emailAddresses: fieldCoverage(
        (c) => c.emailAddresses.oldCount,
        (c) => c.emailAddresses.newCount,
      ),
      aboutLinks: fieldCoverage(
        (c) => c.aboutLinks.oldCount,
        (c) => c.aboutLinks.newCount,
      ),
    };

    // ── Regressions: old had field, new doesn't ──
    const regressions = comparisons
      .filter(
        (c) =>
          c.textContentRegression ||
          (c.socialMedia.oldCount > 0 && c.socialMedia.newCount === 0) ||
          (c.donationLinks.oldCount > 0 && c.donationLinks.newCount === 0) ||
          (c.logoLinks.oldCount > 0 && c.logoLinks.newCount === 0) ||
          (c.emailAddresses.oldCount > 0 &&
            c.emailAddresses.newCount === 0) ||
          c.newsletterRegression,
      )
      .map((c) => ({
        ein: c.ein,
        lostFields: [
          ...(c.textContentRegression ? ["textContent"] : []),
          ...(c.socialMedia.oldCount > 0 && c.socialMedia.newCount === 0
            ? ["socialMediaUrls"]
            : []),
          ...(c.donationLinks.oldCount > 0 && c.donationLinks.newCount === 0
            ? ["donationLinks"]
            : []),
          ...(c.logoLinks.oldCount > 0 && c.logoLinks.newCount === 0
            ? ["logoLinks"]
            : []),
          ...(c.emailAddresses.oldCount > 0 &&
          c.emailAddresses.newCount === 0
            ? ["emailAddresses"]
            : []),
          ...(c.newsletterRegression ? ["hasNewsletterSignup"] : []),
        ],
        oldTextChars: c.old.textContentTotalChars,
        newTextChars: c.new.textContentTotalChars,
      }));

    // ── Improvements: new has field, old didn't ──
    const improvements = comparisons
      .filter(
        (c) =>
          (c.old.textContentTotalChars === 0 &&
            c.new.textContentTotalChars > 0) ||
          (c.socialMedia.oldCount === 0 && c.socialMedia.newCount > 0) ||
          (c.donationLinks.oldCount === 0 && c.donationLinks.newCount > 0) ||
          (c.logoLinks.oldCount === 0 && c.logoLinks.newCount > 0) ||
          (c.emailAddresses.oldCount === 0 &&
            c.emailAddresses.newCount > 0) ||
          (!c.old.hasNewsletterSignup && c.new.hasNewsletterSignup),
      )
      .map((c) => ({
        ein: c.ein,
        gainedFields: [
          ...(c.old.textContentTotalChars === 0 &&
          c.new.textContentTotalChars > 0
            ? ["textContent"]
            : []),
          ...(c.socialMedia.oldCount === 0 && c.socialMedia.newCount > 0
            ? ["socialMediaUrls"]
            : []),
          ...(c.donationLinks.oldCount === 0 && c.donationLinks.newCount > 0
            ? ["donationLinks"]
            : []),
          ...(c.logoLinks.oldCount === 0 && c.logoLinks.newCount > 0
            ? ["logoLinks"]
            : []),
          ...(c.emailAddresses.oldCount === 0 &&
          c.emailAddresses.newCount > 0
            ? ["emailAddresses"]
            : []),
          ...(!c.old.hasNewsletterSignup && c.new.hasNewsletterSignup
            ? ["hasNewsletterSignup"]
            : []),
        ],
        oldTextChars: c.old.textContentTotalChars,
        newTextChars: c.new.textContentTotalChars,
      }));

    // ── Sample details: first 5 for spot-checking ──
    const sampleDetails = comparisons.slice(0, 5).map((c) => ({
      ein: c.ein,
      old: {
        resultCount: c.old.resultCount,
        crawlMethods: c.old.crawlMethods,
        sourceUrls: c.old.sourceUrls,
        textContentChars: c.old.textContentTotalChars,
        textContentNonEmptyResults: c.old.textContentNonEmptyCount,
        socialMediaUrls: c.old.socialMediaUrls,
        donationLinks: c.old.donationLinks,
        logoLinks: c.old.logoLinks,
        aboutLinks: c.old.aboutLinks,
        emailAddresses: c.old.emailAddresses,
        hasNewsletterSignup: c.old.hasNewsletterSignup,
      },
      new: {
        resultCount: c.new.resultCount,
        crawlMethods: c.new.crawlMethods,
        sourceUrls: c.new.sourceUrls,
        textContentChars: c.new.textContentTotalChars,
        textContentNonEmptyResults: c.new.textContentNonEmptyCount,
        socialMediaUrls: c.new.socialMediaUrls,
        donationLinks: c.new.donationLinks,
        logoLinks: c.new.logoLinks,
        aboutLinks: c.new.aboutLinks,
        emailAddresses: c.new.emailAddresses,
        hasNewsletterSignup: c.new.hasNewsletterSignup,
      },
      textContentLengthRatio: c.textContentLengthRatio,
    }));

    return {
      summary,
      regressions: {
        count: regressions.length,
        items: regressions,
      },
      improvements: {
        count: improvements.length,
        items: improvements,
      },
      sampleDetails,
    };
  },
});

/**
 * Fetch actual textContent for an EIN, split old vs new, truncated for readability.
 */
export const inspectTextContent = action({
  args: { ein: v.string(), cutoffTimestamp: v.number(), maxChars: v.optional(v.number()) },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx, { ein, cutoffTimestamp, maxChars }): Promise<Record<string, any>> => {
    const limit = maxChars ?? 2000;
    const data: {
      ein: string;
      oldResults: CrawlRow[];
      newResults: CrawlRow[];
    }[] = await ctx.runQuery(
      internal.comparison.getComparisonDataForEins,
      { eins: [ein], cutoffTimestamp },
    );

    if (data.length === 0) {
      return { error: `No comparison data for EIN ${ein}` };
    }

    const entry = data[0];
    if (!entry) return { error: `No comparison data for EIN ${ein}` };
    const { oldResults, newResults } = entry;

    const formatResults = (results: CrawlRow[]) =>
      results.map((r) => ({
        sourceUrl: r.sourceUrl,
        crawlMethod: r.crawlMethod ?? "unknown",
        textContentLength: (r.textContent ?? "").length,
        textContentPreview: (r.textContent ?? "").slice(0, limit),
      }));

    return {
      ein,
      old: formatResults(oldResults),
      new: formatResults(newResults),
    };
  },
});
