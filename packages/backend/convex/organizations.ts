import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getViewerRecord } from "./lib/viewer";
import {
  applyDiversityPass,
  getSeededVariantScore,
  scoreRecommendation,
} from "./lib/recommendations";

type GeographicFocus = "Global" | "National" | "Regional" | "Local";
const ORGANIZATION_COLLECTION_POOL_SIZE = 60;
const geographicFocusValidator = v.union(
  v.literal("Global"),
  v.literal("National"),
  v.literal("Regional"),
  v.literal("Local"),
);

type OrganizationCollectionFilters = {
  nteeMajors?: string[];
  geographicFocuses?: GeographicFocus[];
  states?: string[];
  preferredState?: string;
};

async function getReadyOrganizationsByNteeMajor(
  ctx: QueryCtx,
  nteeMajor: string,
  limit: number,
) {
  return await ctx.db
    .query("organizations")
    .withIndex("by_enrichmentStage_and_nteeMajor", (q) =>
      q.eq("enrichmentStage", "ready").eq("nteeMajor", nteeMajor),
    )
    .take(limit);
}

async function getReadyOrganizationsByGeographicFocus(
  ctx: QueryCtx,
  geographicFocus: GeographicFocus,
  limit: number,
) {
  return await ctx.db
    .query("organizations")
    .withIndex("by_enrichmentStage_and_geographicFocus", (q) =>
      q.eq("enrichmentStage", "ready").eq("geographicFocus", geographicFocus),
    )
    .take(limit);
}

async function getReadyOrganizationsByState(
  ctx: QueryCtx,
  state: string,
  limit: number,
) {
  return await ctx.db
    .query("organizations")
    .withIndex("by_enrichmentStage_and_state", (q) =>
      q.eq("enrichmentStage", "ready").eq("state", state),
    )
    .take(limit);
}

async function getOrganizationsForCollection(
  ctx: QueryCtx,
  filters: OrganizationCollectionFilters,
  poolLimit: number,
) {
  const queries: Promise<Doc<"organizations">[]>[] = [];

  for (const nteeMajor of filters.nteeMajors ?? []) {
    queries.push(getReadyOrganizationsByNteeMajor(ctx, nteeMajor, poolLimit));
  }

  for (const geographicFocus of filters.geographicFocuses ?? []) {
    queries.push(
      getReadyOrganizationsByGeographicFocus(ctx, geographicFocus, poolLimit),
    );
  }

  for (const state of filters.states ?? []) {
    queries.push(getReadyOrganizationsByState(ctx, state, poolLimit));
  }

  if (queries.length === 0) {
    queries.push(
      ctx.db
        .query("organizations")
        .withIndex("by_enrichmentStage", (q) =>
          q.eq("enrichmentStage", "ready"),
        )
        .take(poolLimit),
    );
  }

  const batches = await Promise.all(queries);
  return uniqueById(batches.flat());
}

function uniqueById(organizations: Doc<"organizations">[]) {
  return Array.from(
    new Map(
      organizations.map((organization) => [organization._id, organization]),
    ).values(),
  );
}

function applySeededCollectionSampling(
  organizations: Doc<"organizations">[],
  collectionKey: string,
  limit: number,
  sessionSeed?: string,
  preferredState?: string,
) {
  const seed = `${sessionSeed ?? "default"}:${collectionKey}`;

  return [...organizations]
    .sort((left, right) => {
      if (preferredState && left.state !== right.state) {
        if (right.state === preferredState) {
          return 1;
        }
        if (left.state === preferredState) {
          return -1;
        }
      }

      const rightScore = getSeededVariantScore(seed, right.slug);
      const leftScore = getSeededVariantScore(seed, left.slug);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

// Get single org by slug (for detail page)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
  },
});

// Get recommended orgs for discover page
export const getRecommended = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .take(limit);
  },
});

export const getPersonalizedRecommended = query({
  args: {
    guestId: v.optional(v.string()),
    limit: v.optional(v.number()),
    sessionSeed: v.optional(v.string()),
  },
  handler: async (ctx, { guestId, limit = 10, sessionSeed }) => {
    const viewer = await getViewerRecord(ctx, guestId);
    const likedOrganizations = new Set(viewer.user?.likedOrganizations ?? []);
    const dismissedOrganizations = new Set(
      viewer.user?.dismissedOrganizations ?? [],
    );
    const candidates = new Map<string, Doc<"organizations">>();
    const candidateTarget = Math.max(limit * 10, 150);

    const addCandidates = (organizations: Doc<"organizations">[]) => {
      for (const organization of organizations) {
        if (
          organization.enrichmentStage !== "ready" ||
          likedOrganizations.has(organization.slug) ||
          dismissedOrganizations.has(organization.slug)
        ) {
          continue;
        }
        candidates.set(organization._id, organization);
      }
    };

    if (candidates.size < candidateTarget) {
      addCandidates(
        await ctx.db
          .query("organizations")
          .withIndex("by_enrichmentStage", (q) =>
            q.eq("enrichmentStage", "ready"),
          )
          .take(candidateTarget),
      );
    }

    const scoredRecommendations = Array.from(candidates.values())
      .map((organization) => {
        const recommendation = scoreRecommendation(organization);
        const seededVariantScore = getSeededVariantScore(
          sessionSeed ?? "default",
          organization.slug,
        );
        return {
          organization,
          ...recommendation,
          rankScore: recommendation.score + seededVariantScore,
        };
      })
      .sort((left, right) => {
        if (right.rankScore !== left.rankScore) {
          return right.rankScore - left.rankScore;
        }
        return left.organization.name.localeCompare(right.organization.name);
      });

    return applyDiversityPass(
      scoredRecommendations.map(
        ({ rankScore: _rankScore, ...recommendation }) => recommendation,
      ),
      limit,
    );
  },
});

// Get orgs for carousel display (fetch extra for client-side shuffling)
export const getForCarousel = query({
  args: {},
  handler: async (ctx) => {
    // Fetch more than needed so client can shuffle and pick 30
    return await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .take(100);
  },
});

// Paginated query for infinite scroll grid
export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .paginate(paginationOpts);
  },
});

// Full-text search organizations by name
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    if (!query.trim()) return [];

    return await ctx.db
      .query("organizations")
      .withSearchIndex("search_name", (q) =>
        q.search("name", query).eq("enrichmentStage", "ready"),
      )
      .take(20);
  },
});

// Get multiple orgs by slugs (for liked causes)
export const getBySlugs = query({
  args: { slugs: v.array(v.string()) },
  handler: async (ctx, { slugs }) => {
    if (slugs.length === 0) return [];
    const orgs = await Promise.all(
      slugs.map((slug) =>
        ctx.db
          .query("organizations")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first(),
      ),
    );
    return orgs.filter(Boolean);
  },
});

// Get liked organizations for the current viewer (combined query to avoid waterfall)
export const getLikedByViewer = query({
  args: { guestId: v.optional(v.string()) },
  handler: async (ctx, { guestId }) => {
    const viewer = await getViewerRecord(ctx, guestId);
    const user =
      viewer.user ||
      (viewer.kind === "authenticated" && guestId
        ? await ctx.db
            .query("users")
            .withIndex("by_guestId", (q) => q.eq("guestId", guestId))
            .first()
        : null);

    if (!user || user.likedOrganizations.length === 0) return [];

    const orgs = await Promise.all(
      user.likedOrganizations.map((slug) =>
        ctx.db
          .query("organizations")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first(),
      ),
    );
    // Filter out nulls with proper type narrowing
    return orgs.filter((org): org is NonNullable<typeof org> => org !== null);
  },
});

// Get organizations by NTEE major category
export const getByNteeMajor = query({
  args: {
    nteeMajor: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { nteeMajor, limit = 15 }) => {
    return await getReadyOrganizationsByNteeMajor(ctx, nteeMajor, limit);
  },
});

// Get organizations by geographic focus
export const getByGeographicFocus = query({
  args: {
    focus: geographicFocusValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { focus, limit = 15 }) => {
    return await getReadyOrganizationsByGeographicFocus(ctx, focus, limit);
  },
});

// ─── Editorial: Cause of the Week ───────────────────────────────────────────

const EDITORIAL_POOL_SIZE = 200;

function passesEditorialQualityGate(org: Doc<"organizations">) {
  return Boolean(org.logoUrl?.trim() && org.tagline?.trim());
}

async function takeReadyEditorialPool(
  ctx: QueryCtx,
  options: { state?: string },
): Promise<Doc<"organizations">[]> {
  const { state } = options;
  if (state) {
    const stated = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage_and_state", (q) =>
        q.eq("enrichmentStage", "ready").eq("state", state),
      )
      .take(EDITORIAL_POOL_SIZE);
    if (stated.length >= 40) return stated;

    const fallback = await ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
      .take(EDITORIAL_POOL_SIZE);

    return uniqueById([...stated, ...fallback]).slice(0, EDITORIAL_POOL_SIZE);
  }

  return await ctx.db
    .query("organizations")
    .withIndex("by_enrichmentStage", (q) => q.eq("enrichmentStage", "ready"))
    .take(EDITORIAL_POOL_SIZE);
}

export const getCauseOfTheWeek = query({
  args: { weekKey: v.string() },
  handler: async (ctx, { weekKey }) => {
    const pool = await takeReadyEditorialPool(ctx, {});

    // Keep the hero populated even when an environment's ready data has not
    // fully cleared the stricter editorial completeness bar yet.
    const qualityCandidates = pool.filter(passesEditorialQualityGate);
    const candidates = qualityCandidates.length > 0 ? qualityCandidates : pool;
    if (candidates.length === 0) {
      return null;
    }

    const seed = `cause-of-the-week:${weekKey}`;
    const sorted = [...candidates].sort((left, right) => {
      const rightScore = getSeededVariantScore(seed, right.slug);
      const leftScore = getSeededVariantScore(seed, left.slug);
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.name.localeCompare(right.name);
    });

    return sorted[0] ?? null;
  },
});

export const getEditorsPicks = query({
  args: {
    weekKey: v.string(),
    excludeSlugs: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { weekKey, excludeSlugs = [] }) => {
    const exclude = new Set(excludeSlugs);
    const pool = await takeReadyEditorialPool(ctx, {});

    const candidates = pool.filter(
      (org) => passesEditorialQualityGate(org) && !exclude.has(org.slug),
    );
    if (candidates.length === 0) return [];

    const seed = `editors-picks:${weekKey}`;
    const sorted = [...candidates].sort((left, right) => {
      const rightScore = getSeededVariantScore(seed, right.slug);
      const leftScore = getSeededVariantScore(seed, left.slug);
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.name.localeCompare(right.name);
    });

    const picks: Doc<"organizations">[] = [];
    const seenMajors = new Set<string>();
    for (const org of sorted) {
      if (picks.length === 3) break;
      const major = org.nteeMajor ?? "__unknown__";
      if (seenMajors.has(major) && picks.length < 2) continue;
      picks.push(org);
      seenMajors.add(major);
    }

    if (picks.length < 3) {
      for (const org of sorted) {
        if (picks.length === 3) break;
        if (!picks.includes(org)) picks.push(org);
      }
    }

    return picks;
  },
});

const SCALE_BUCKETS: Record<
  "small" | "medium" | "large",
  ("micro" | "small" | "mid" | "large" | "mega")[]
> = {
  small: ["micro", "small"],
  medium: ["mid"],
  large: ["large", "mega"],
};

async function takeByAssetBuckets(
  ctx: QueryCtx,
  buckets: ("micro" | "small" | "mid" | "large" | "mega")[],
  perBucketLimit: number,
) {
  const batches = await Promise.all(
    buckets.map((bucket) =>
      ctx.db
        .query("organizations")
        .withIndex("by_enrichmentStage_and_assetBucket", (q) =>
          q.eq("enrichmentStage", "ready").eq("assetBucket", bucket),
        )
        .take(perBucketLimit),
    ),
  );

  return uniqueById(batches.flat()).filter(passesEditorialQualityGate);
}

export const getOrganizationsByScale = query({
  args: {
    weekKey: v.string(),
    perColumn: v.optional(v.number()),
  },
  handler: async (ctx, { weekKey, perColumn = 4 }) => {
    const seed = `scale-strip:${weekKey}`;
    const result: Record<"small" | "medium" | "large", Doc<"organizations">[]> =
      {
        small: [],
        medium: [],
        large: [],
      };

    for (const key of ["small", "medium", "large"] as const) {
      const candidates = await takeByAssetBuckets(ctx, SCALE_BUCKETS[key], 20);
      const sorted = [...candidates].sort((left, right) => {
        const rightScore = getSeededVariantScore(`${seed}:${key}`, right.slug);
        const leftScore = getSeededVariantScore(`${seed}:${key}`, left.slug);
        if (rightScore !== leftScore) return rightScore - leftScore;
        return left.name.localeCompare(right.name);
      });
      result[key] = sorted.slice(0, perColumn);
    }

    return result;
  },
});

export const listByCategoryPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    kind: v.union(v.literal("ntee"), v.literal("geo")),
    nteeMajor: v.optional(v.string()),
    geographicFocus: v.optional(geographicFocusValidator),
    state: v.optional(v.string()),
    hasLogo: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { paginationOpts, kind, nteeMajor, geographicFocus, state, hasLogo },
  ) => {
    if (kind === "ntee") {
      if (!nteeMajor) {
        throw new Error("nteeMajor is required when kind is 'ntee'");
      }

      const indexed = ctx.db
        .query("organizations")
        .withIndex("by_enrichmentStage_and_nteeMajor_and_name", (qb) =>
          qb.eq("enrichmentStage", "ready").eq("nteeMajor", nteeMajor),
        );

      if (!state && !hasLogo) {
        return await indexed.paginate(paginationOpts);
      }

      return await indexed
        .filter((qb) => {
          if (state && hasLogo) {
            return qb.and(
              qb.eq(qb.field("state"), state),
              qb.neq(qb.field("logoUrl"), undefined),
            );
          }
          if (state) return qb.eq(qb.field("state"), state);
          return qb.neq(qb.field("logoUrl"), undefined);
        })
        .paginate(paginationOpts);
    }

    if (!geographicFocus) {
      throw new Error("geographicFocus is required when kind is 'geo'");
    }

    const indexed = ctx.db
      .query("organizations")
      .withIndex("by_enrichmentStage_and_geographicFocus_and_name", (qb) =>
        qb
          .eq("enrichmentStage", "ready")
          .eq("geographicFocus", geographicFocus),
      );

    if (!state && !hasLogo) {
      return await indexed.paginate(paginationOpts);
    }

    return await indexed
      .filter((qb) => {
        if (state && hasLogo) {
          return qb.and(
            qb.eq(qb.field("state"), state),
            qb.neq(qb.field("logoUrl"), undefined),
          );
        }
        if (state) return qb.eq(qb.field("state"), state);
        return qb.neq(qb.field("logoUrl"), undefined);
      })
      .paginate(paginationOpts);
  },
});

export const getOrganizationCollection = query({
  args: {
    collectionKey: v.string(),
    filters: v.object({
      nteeMajors: v.optional(v.array(v.string())),
      geographicFocuses: v.optional(v.array(geographicFocusValidator)),
      states: v.optional(v.array(v.string())),
      preferredState: v.optional(v.string()),
    }),
    limit: v.optional(v.number()),
    poolLimit: v.optional(v.number()),
    sessionSeed: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { collectionKey, filters, limit = 15, poolLimit, sessionSeed },
  ) => {
    const organizations = await getOrganizationsForCollection(
      ctx,
      filters,
      poolLimit ?? Math.max(limit * 4, ORGANIZATION_COLLECTION_POOL_SIZE),
    );

    return applySeededCollectionSampling(
      organizations,
      collectionKey,
      limit,
      sessionSeed,
      filters.preferredState,
    );
  },
});
