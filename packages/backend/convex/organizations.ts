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
type NteeMajorFilter = string | null;
const ORGANIZATION_COLLECTION_POOL_SIZE = 60;
const geographicFocusValidator = v.union(
  v.literal("Global"),
  v.literal("National"),
  v.literal("Regional"),
  v.literal("Local"),
);
const nteeMajorFilterValidator = v.union(v.string(), v.null());

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

// ─── Editorial: Featured Causes ─────────────────────────────────────────────

const EDITORIAL_POOL_SIZE = 200;
const FEATURED_CAUSES_COUNT = 5;

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

export const getFeaturedCauses = query({
  args: { weekKey: v.string() },
  handler: async (ctx, { weekKey }) => {
    const pool = await takeReadyEditorialPool(ctx, {});

    // Keep the hero populated even when an environment's ready data has not
    // fully cleared the stricter editorial completeness bar yet.
    const qualityCandidates = pool.filter(passesEditorialQualityGate);
    const candidates = qualityCandidates.length > 0 ? qualityCandidates : pool;
    if (candidates.length === 0) {
      return [];
    }

    const seed = `featured-causes:${weekKey}`;
    const sorted = [...candidates].sort((left, right) => {
      const rightScore = getSeededVariantScore(seed, right.slug);
      const leftScore = getSeededVariantScore(seed, left.slug);
      if (rightScore !== leftScore) return rightScore - leftScore;
      return left.name.localeCompare(right.name);
    });

    return sorted.slice(0, FEATURED_CAUSES_COUNT);
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
    nteeMajors: v.optional(v.array(nteeMajorFilterValidator)),
    geographicFocus: v.optional(geographicFocusValidator),
    geographicFocuses: v.optional(v.array(geographicFocusValidator)),
    state: v.optional(v.string()),
    states: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    {
      paginationOpts,
      kind,
      nteeMajor,
      nteeMajors,
      geographicFocus,
      geographicFocuses,
      state,
      states,
    },
  ) => {
    const geographicFocusFilters =
      geographicFocuses && geographicFocuses.length > 0
        ? geographicFocuses
        : geographicFocus
          ? [geographicFocus]
          : [];
    const stateFilters =
      states && states.length > 0 ? states : state ? [state] : [];

    if (kind === "ntee") {
      const majorFilters: NteeMajorFilter[] =
        nteeMajors && nteeMajors.length > 0
          ? nteeMajors
          : nteeMajor
            ? [nteeMajor]
            : [];

      if (majorFilters.length === 0) {
        throw new Error("nteeMajors is required when kind is 'ntee'");
      }

      const onlyMajor = majorFilters[0];
      if (majorFilters.length === 1 && typeof onlyMajor === "string") {
        const indexed = ctx.db
          .query("organizations")
          .withIndex("by_enrichmentStage_and_nteeMajor_and_name", (qb) =>
            qb.eq("enrichmentStage", "ready").eq("nteeMajor", onlyMajor),
          );

        if (geographicFocusFilters.length === 0 && stateFilters.length === 0) {
          return await indexed.paginate(paginationOpts);
        }

        return await indexed
          .filter((qb) => {
            const conditions = [];
            if (geographicFocusFilters.length > 0) {
              const geographicFocusConditions = geographicFocusFilters.map(
                (focus) => qb.eq(qb.field("geographicFocus"), focus),
              );
              conditions.push(
                geographicFocusConditions.length === 1
                  ? geographicFocusConditions[0]!
                  : qb.or(...geographicFocusConditions),
              );
            }
            if (stateFilters.length > 0) {
              const stateConditions = stateFilters.map((stateFilter) =>
                qb.eq(qb.field("state"), stateFilter),
              );
              conditions.push(
                stateConditions.length === 1
                  ? stateConditions[0]!
                  : qb.or(...stateConditions),
              );
            }

            return conditions.length === 1
              ? conditions[0]!
              : qb.and(...conditions);
          })
          .paginate(paginationOpts);
      }

      const indexed = ctx.db
        .query("organizations")
        .withIndex("by_enrichmentStage", (qb) =>
          qb.eq("enrichmentStage", "ready"),
        );

      return await indexed
        .filter((qb) => {
          const nteeConditions = majorFilters.map((major) =>
            qb.eq(qb.field("nteeMajor"), major ?? undefined),
          );
          const nteeCondition =
            nteeConditions.length === 1
              ? nteeConditions[0]!
              : qb.or(...nteeConditions);
          const conditions = [nteeCondition];

          if (geographicFocusFilters.length > 0) {
            const geographicFocusConditions = geographicFocusFilters.map(
              (focus) => qb.eq(qb.field("geographicFocus"), focus),
            );
            conditions.push(
              geographicFocusConditions.length === 1
                ? geographicFocusConditions[0]!
                : qb.or(...geographicFocusConditions),
            );
          }
          if (stateFilters.length > 0) {
            const stateConditions = stateFilters.map((stateFilter) =>
              qb.eq(qb.field("state"), stateFilter),
            );
            conditions.push(
              stateConditions.length === 1
                ? stateConditions[0]!
                : qb.or(...stateConditions),
            );
          }

          return conditions.length === 1
            ? conditions[0]!
            : qb.and(...conditions);
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

    if (stateFilters.length === 0) {
      return await indexed.paginate(paginationOpts);
    }

    return await indexed
      .filter((qb) => {
        const stateConditions = stateFilters.map((stateFilter) =>
          qb.eq(qb.field("state"), stateFilter),
        );
        return stateConditions.length === 1
          ? stateConditions[0]!
          : qb.or(...stateConditions);
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
