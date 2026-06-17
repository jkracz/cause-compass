"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePaginatedQuery, useQueries, useQuery } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Compass, Loader2, Search } from "lucide-react";

import { DynamicOrganizationModal } from "@/components/dynamic-organization-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { useWeekKey } from "@/hooks/use-week-key";
import { api } from "@cause/backend/convex/_generated/api";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import {
  FeaturedCauses,
  FeaturedCausesSkeleton,
} from "@/components/editorial/featured-causes";
import { EditorialSearch } from "@/components/editorial/editorial-search";
import { CategoryMosaic } from "@/components/editorial/category-mosaic";
import {
  ScaleStrip,
  ScaleStripSkeleton,
} from "@/components/editorial/scale-strip";
import { EditorialCarousel } from "@/components/editorial/editorial-carousel";
import { EditorialOrgCard } from "@/components/editorial/editorial-org-card";
import { SectionHeader } from "@/components/editorial/section-header";
import { analytics } from "@/lib/analytics-client";
import { HOME_NAVIGATION_EVENT } from "@/lib/home-navigation";
import { useLocationPreference } from "@/components/location-preference-provider";
import { US_STATES } from "@/lib/us-states";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Organization = Doc<"organizations">;

type GeographicFocus = "Global" | "National" | "Regional" | "Local";

const REACH_FILTERS: GeographicFocus[] = [
  "Local",
  "Regional",
  "National",
  "Global",
];

const REACH_CAROUSELS = [
  {
    key: "communityRooted",
    title: "Community-rooted work",
    subtitle: "Organizations focused close to the communities they serve.",
    filters: { geographicFocuses: ["Local", "Regional"] },
  },
  {
    key: "workingAcrossBorders",
    title: "Working across borders",
    subtitle:
      "Organizations serving communities and causes beyond one country.",
    filters: { geographicFocuses: ["Global"] },
  },
] satisfies {
  key: string;
  title: string;
  subtitle: string;
  filters: { geographicFocuses: GeographicFocus[] };
}[];

function createSessionSeed() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
}

export function DiscoveryHomeContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionSeed] = useState(createSessionSeed);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilters, setStateFilters] = useState<string[]>([]);
  const [reachFilters, setReachFilters] = useState<GeographicFocus[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closedSharedOrgSlug, setClosedSharedOrgSlug] = useState<string | null>(
    null,
  );
  const trackedSharedOrgSlugRef = useRef<string | null>(null);
  const userChangedStateFiltersRef = useRef(false);
  const searchSentinelRef = useRef<HTMLDivElement | null>(null);
  const locationPreference = useLocationPreference();
  const preferredState = locationPreference.activeState?.stateCode;

  const debouncedQuery = useDebounce(searchQuery, 300);
  const isSearching = searchQuery.trim().length > 0;
  const shouldRunSearch = debouncedQuery.trim().length > 0;
  const sharedOrgSlug = searchParams.get("org");

  const weekKey = useWeekKey();

  // Featured Causes
  const featuredCauses = useQuery(api.organizations.getFeaturedCauses, {
    weekKey,
    state: preferredState,
  });
  const scaleData = useQuery(api.organizations.getOrganizationsByScale, {
    weekKey,
  });

  // Reach carousels
  const collectionQueries = useMemo(
    () =>
      Object.fromEntries(
        REACH_CAROUSELS.map((row) => [
          row.key,
          {
            query: api.organizations.getOrganizationCollection,
            args: {
              collectionKey: row.key,
              filters: { ...row.filters, preferredState },
              sessionSeed,
            },
          },
        ]),
      ),
    [preferredState, sessionSeed],
  );
  const rowResults = useQueries(collectionQueries);

  const {
    results: searchResults,
    status: searchStatus,
    loadMore: loadMoreSearchResults,
  } = usePaginatedQuery(
    api.organizations.search,
    shouldRunSearch
      ? {
          query: debouncedQuery,
          geographicFocuses: reachFilters.length > 0 ? reachFilters : undefined,
          states: stateFilters.length > 0 ? stateFilters : undefined,
        }
      : "skip",
    { initialNumItems: 24 },
  );
  const sharedOrganization = useQuery(
    api.organizations.getBySlug,
    sharedOrgSlug ? { slug: sharedOrgSlug } : "skip",
  );

  const isSearchLoading =
    isSearching && (!shouldRunSearch || searchStatus === "LoadingFirstPage");

  const rowError = Object.values(rowResults).find(
    (result): result is Error => result instanceof Error,
  );
  if (rowError) throw rowError;

  useEffect(() => {
    const handleHomeNavigation = () => {
      setSearchQuery("");
    };

    window.addEventListener(HOME_NAVIGATION_EVENT, handleHomeNavigation);

    return () => {
      window.removeEventListener(HOME_NAVIGATION_EVENT, handleHomeNavigation);
    };
  }, []);

  useEffect(() => {
    if (userChangedStateFiltersRef.current) return;
    setStateFilters(preferredState ? [preferredState] : []);
  }, [preferredState]);

  useEffect(() => {
    if (!isSearching) return;
    const sentinel = searchSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && searchStatus === "CanLoadMore") {
          loadMoreSearchResults(24);
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isSearching, searchStatus, loadMoreSearchResults]);

  useEffect(() => {
    if (!sharedOrgSlug) {
      trackedSharedOrgSlugRef.current = null;
      return;
    }
    if (!sharedOrganization) return;
    if (trackedSharedOrgSlugRef.current === sharedOrgSlug) return;

    trackedSharedOrgSlugRef.current = sharedOrgSlug;
    analytics.capture("organization_details_viewed", {
      organization_id: sharedOrganization.slug,
      organization_name: sharedOrganization.name,
      organization_ein: sharedOrganization.ein,
      organization_city: sharedOrganization.city,
      organization_state: sharedOrganization.state,
      source: "shared_link",
    });
  }, [sharedOrgSlug, sharedOrganization]);

  const setOrgUrlParam = useCallback(
    (slug?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("org", slug);
        setClosedSharedOrgSlug(null);
      } else {
        params.delete("org");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleCardClick = useCallback(
    (org: Organization) => {
      setSelectedOrg(org);
      setIsModalOpen(true);
      setOrgUrlParam(org.slug);
      analytics.capture("organization_details_viewed", {
        organization_id: org.slug,
        organization_name: org.name,
        organization_ein: org.ein,
        organization_city: org.city,
        organization_state: org.state,
        source: isSearching ? "search_results" : "editorial",
        search_query: isSearching ? debouncedQuery : undefined,
      });
    },
    [isSearching, debouncedQuery, setOrgUrlParam],
  );

  const handleCloseModal = () => {
    if (sharedOrgSlug) {
      setClosedSharedOrgSlug(sharedOrgSlug);
    }
    setIsModalOpen(false);
    setSelectedOrg(null);
    setOrgUrlParam();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 0) {
      analytics.capture("search_initiated", { query_length: value.length });
    }
  };

  const toggleReachFilter = (reach: GeographicFocus) => {
    setReachFilters((current) =>
      current.includes(reach)
        ? current.filter((value) => value !== reach)
        : [...current, reach],
    );
  };

  const toggleStateFilter = (state: string) => {
    userChangedStateFiltersRef.current = true;
    setStateFilters((current) =>
      current.includes(state)
        ? current.filter((value) => value !== state)
        : [...current, state],
    );
  };

  const reachLabel =
    reachFilters.length === 0
      ? "Any"
      : reachFilters.length === 1
        ? reachFilters[0]
        : `${reachFilters.length} selected`;

  const stateLabel =
    stateFilters.length === 0
      ? "Any"
      : stateFilters.length === 1
        ? (US_STATES.find((state) => state.code === stateFilters[0])?.code ??
          stateFilters[0])
        : `${stateFilters.length} selected`;

  const reachCarousels = REACH_CAROUSELS.map((row) => {
    const result = rowResults[row.key] as Organization[] | undefined;
    return {
      ...row,
      organizations: result ?? [],
      isLoading: result === undefined,
    };
  });
  const activeSharedOrgSlug =
    sharedOrgSlug && sharedOrgSlug !== closedSharedOrgSlug
      ? sharedOrgSlug
      : null;
  const selectedOrgMatchesSharedSlug =
    selectedOrg?.slug === activeSharedOrgSlug;
  const modalOrganization =
    (activeSharedOrgSlug ? sharedOrganization : null) ||
    (selectedOrgMatchesSharedSlug ? selectedOrg : null);
  const isOrganizationModalOpen = Boolean(
    activeSharedOrgSlug ? modalOrganization : selectedOrg && isModalOpen,
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Atmospheric blush halo at the top of the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
      >
        <div className="absolute -top-40 left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 md:px-8 md:pt-14">
        {/* Hero: Featured Causes */}
        <div className="editorial-fade-up">
          {featuredCauses === undefined && <FeaturedCausesSkeleton />}
          {featuredCauses && featuredCauses.length === 0 && (
            <EmptyEditorialState message="No featured organizations available this week." />
          )}
          {featuredCauses && featuredCauses.length > 0 && (
            <FeaturedCauses
              organizations={featuredCauses}
              onLearnMore={handleCardClick}
            />
          )}
        </div>

        {/* Unified search & browse module — heading carries both affordances. */}
        <section
          className="editorial-fade-up mt-20 md:mt-24"
          aria-labelledby="search-browse-heading"
          style={{ animationDelay: "0.1s" }}
        >
          <SectionHeader
            title={
              <span id="search-browse-heading">
                Find something to{" "}
                <span className="font-medium text-[var(--accent)] italic">
                  care
                </span>{" "}
                about.
              </span>
            }
            subtitle="Type what you're curious about, or pick a cause and wander."
          />
          <div className="mt-7">
            <EditorialSearch
              value={searchQuery}
              onChange={handleSearchChange}
              isLoading={isSearchLoading}
            />
          </div>
        </section>

        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.section
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 md:mt-4"
            >
              <div className="mb-7 flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-[var(--rule)] bg-white/65 px-3 py-2.5 backdrop-blur">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] font-medium transition focus-visible:border-[var(--accent)]/50 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/15 focus-visible:outline-none",
                        reachFilters.length > 0
                          ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--rule)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent)]/40",
                      )}
                    >
                      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                        Reach
                      </span>
                      <span>{reachLabel}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-44 border-[var(--rule)] bg-white text-[var(--ink-soft)]"
                  >
                    <DropdownMenuLabel className="text-[10px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
                      Reach
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--rule)]" />
                    {REACH_FILTERS.map((reach) => (
                      <DropdownMenuCheckboxItem
                        key={reach}
                        checked={reachFilters.includes(reach)}
                        onCheckedChange={() => toggleReachFilter(reach)}
                        onSelect={(event) => event.preventDefault()}
                        className="text-[13px]"
                      >
                        {reach}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[12px] font-medium transition focus-visible:border-[var(--accent)]/50 focus-visible:ring-2 focus-visible:ring-[var(--accent)]/15 focus-visible:outline-none",
                        stateFilters.length > 0
                          ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--rule)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent)]/40",
                      )}
                    >
                      <span className="text-[10px] font-semibold tracking-[0.18em] uppercase">
                        HQ State
                      </span>
                      <span>{stateLabel}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-80 w-60 overflow-y-auto border-[var(--rule)] bg-white text-[var(--ink-soft)]"
                  >
                    <DropdownMenuLabel className="text-[10px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase">
                      HQ State
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--rule)]" />
                    {US_STATES.map((state) => (
                      <DropdownMenuCheckboxItem
                        key={state.code}
                        checked={stateFilters.includes(state.code)}
                        onCheckedChange={() => toggleStateFilter(state.code)}
                        onSelect={(event) => event.preventDefault()}
                        className="text-[13px]"
                      >
                        {state.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {(reachFilters.length > 0 || stateFilters.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setReachFilters([]);
                      userChangedStateFiltersRef.current = true;
                      setStateFilters([]);
                    }}
                    className="ml-auto text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase underline-offset-4 hover:text-[var(--accent)] hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>

              {shouldRunSearch && !isSearchLoading && (
                <p className="mb-6 text-[12px] font-semibold tracking-[0.22em] text-[var(--ink-mute)] uppercase">
                  {searchResults.length === 0
                    ? `No matches for "${debouncedQuery}"`
                    : `Showing ${searchResults.length} result${
                        searchResults.length === 1 ? "" : "s"
                      } for "${debouncedQuery}"`}
                </p>
              )}

              {isSearchLoading && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[300px] animate-pulse rounded-[1.25rem] bg-[var(--paper-deep)]"
                    />
                  ))}
                </div>
              )}

              {!isSearchLoading && searchResults.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {searchResults.map((org) => (
                    <EditorialOrgCard
                      key={org._id}
                      organization={org}
                      onClick={() => handleCardClick(org)}
                    />
                  ))}
                </div>
              )}

              {!isSearchLoading &&
                shouldRunSearch &&
                searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--rule)] bg-white/40 py-20 text-center">
                    <Search className="mb-4 h-12 w-12 text-[var(--ink-mute)]" />
                    <p className="text-[var(--ink-soft)]">
                      No nonprofits found matching your search
                    </p>
                    <button
                      onClick={() => handleSearchChange("")}
                      className="mt-4 text-[11px] font-semibold tracking-[0.22em] text-[var(--ink-mute)] uppercase underline-offset-4 hover:text-[var(--accent)] hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}

              <div
                ref={searchSentinelRef}
                className="h-12 w-full"
                aria-hidden
              />

              {searchStatus === "LoadingMore" && searchResults.length > 0 && (
                <div className="flex justify-center py-8 text-[var(--ink-mute)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}

              {searchStatus === "Exhausted" && searchResults.length > 0 && (
                <div className="py-12 text-center text-[11px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
                  — End of results —
                </div>
              )}
            </motion.section>
          ) : (
            <motion.div
              key="editorial-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-10 space-y-20"
            >
              {/* Browse by cause — the full taxonomy. */}
              <div className="editorial-fade-up">
                <CategoryMosaic />
              </div>

              {/* Reach carousels — discovery lenses by geographic scope. */}
              {reachCarousels.map((row) =>
                row.isLoading ? (
                  <div key={row.key} className="editorial-fade-up">
                    <CarouselSkeleton title={row.title} />
                  </div>
                ) : row.organizations.length === 0 ? null : (
                  <div key={row.key} className="editorial-fade-up">
                    <EditorialCarousel
                      title={row.title}
                      subtitle={row.subtitle}
                      organizations={row.organizations}
                      onCardClick={handleCardClick}
                      rowKey={row.key}
                    />
                  </div>
                ),
              )}

              {/* Browse by scale — the dedicated asset-size module. */}
              <div className="editorial-fade-up">
                {scaleData === undefined ? (
                  <ScaleStripSkeleton />
                ) : (
                  <ScaleStrip data={scaleData} onCardClick={handleCardClick} />
                )}
              </div>

              {/* Empty state */}
              {featuredCauses?.length === 0 &&
                reachCarousels.every(
                  (r) => !r.isLoading && r.organizations.length === 0,
                ) && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Compass className="mb-4 h-12 w-12 text-[var(--ink-mute)]" />
                    <p className="text-[var(--ink-soft)]">
                      No organizations available yet
                    </p>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {modalOrganization && (
        <DynamicOrganizationModal
          organization={modalOrganization}
          isOpen={isOrganizationModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}

function EmptyEditorialState({ message }: { message: string }) {
  return (
    <div className="flex h-[420px] items-center justify-center rounded-[2rem] border border-dashed border-[var(--rule)] bg-white/40 text-center">
      <p className="text-[var(--ink-soft)]">{message}</p>
    </div>
  );
}

function CarouselSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-[clamp(1.75rem,2.5vw,2.5rem)] font-semibold text-[var(--ink)]">
        {title}
      </h2>
      <div className="-mx-4 flex gap-[18px] overflow-hidden px-4 md:-mx-8 md:px-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[300px] w-[280px] flex-shrink-0 animate-pulse rounded-[1.25rem] bg-[var(--paper-deep)] sm:w-[300px]"
          />
        ))}
      </div>
    </div>
  );
}
