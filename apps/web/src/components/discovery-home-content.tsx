"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueries, useQuery } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import posthog from "posthog-js";
import { Compass, Search, X, Loader2 } from "lucide-react";

import { CategoryRow } from "@/components/category-row";
import { OrganizationModal } from "@/components/organization-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { CATEGORY_ROW_TITLES } from "@/lib/ntee-labels";
import { api } from "@cause/backend/convex/_generated/api";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { useAppSession } from "@/components/app-session-provider";
import {
  reverseGeocodeForSession,
  type SessionLocation,
} from "@/app/discover/actions";

type Organization = Doc<"organizations">;
type StoredCoordinates = {
  latitude: number;
  longitude: number;
};
type GeographicFocus = "Global" | "National" | "Regional" | "Local";
type CollectionFilters = {
  nteeMajors?: string[];
  geographicFocuses?: GeographicFocus[];
  states?: string[];
  preferredState?: string;
};

const HOME_PAGE_ROW_CONFIG = [
  {
    key: "artsAndCulture",
    title: CATEGORY_ROW_TITLES.artsAndCulture,
    filters: { nteeMajors: ["A"] },
  },
  {
    key: "education",
    title: CATEGORY_ROW_TITLES.education,
    filters: { nteeMajors: ["B"] },
  },
  {
    key: "healthAndWellness",
    title: CATEGORY_ROW_TITLES.healthAndWellness,
    filters: { nteeMajors: ["E", "F"] },
  },
  {
    key: "environmentAndAnimals",
    title: CATEGORY_ROW_TITLES.environmentAndAnimals,
    filters: { nteeMajors: ["C", "D"] },
  },
  {
    key: "globalImpact",
    title: CATEGORY_ROW_TITLES.globalImpact,
    filters: { geographicFocuses: ["Global"] },
  },
  {
    key: "localCommunity",
    title: CATEGORY_ROW_TITLES.localCommunity,
    filters: { geographicFocuses: ["Local"] },
    preferSessionState: true,
  },
] satisfies {
  key: string;
  title: string;
  filters: CollectionFilters;
  preferSessionState?: boolean;
}[];

function createSessionSeed() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
}

function parseStoredCoordinates(location?: string): StoredCoordinates | null {
  if (!location?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(location) as {
      latitude?: unknown;
      longitude?: unknown;
    };

    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function getCollectionFilters(
  row: (typeof HOME_PAGE_ROW_CONFIG)[number],
  sessionState?: string,
): CollectionFilters {
  if (!row.preferSessionState || !sessionState) {
    return row.filters;
  }

  return {
    ...row.filters,
    states: [sessionState],
    preferredState: sessionState,
  };
}

export function DiscoveryHomeContent() {
  const { guestId } = useAppSession();
  const viewer = useQuery(api.users.getViewer, guestId ? { guestId } : {});
  const [sessionSeed] = useState(createSessionSeed);
  const [sessionLocation, setSessionLocation] =
    useState<SessionLocation | null>(null);
  const [sessionLocationResolved, setSessionLocationResolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const isSearching = debouncedQuery.length > 0;

  useEffect(() => {
    if (viewer === undefined || sessionLocationResolved) {
      return;
    }

    const storedLocation = viewer?.preferences.location;
    if (
      !storedLocation ||
      storedLocation === "skipped" ||
      storedLocation === "denied" ||
      storedLocation === "unavailable"
    ) {
      startTransition(() => {
        setSessionLocationResolved(true);
      });
      return;
    }

    const resolveSessionLocation = async () => {
      try {
        const storedCoordinates = parseStoredCoordinates(storedLocation);
        let coordinates = storedCoordinates;

        if (!coordinates && storedLocation === "granted") {
          coordinates = await new Promise<StoredCoordinates>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(
                (position) =>
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  }),
                reject,
                {
                  timeout: 10000,
                  enableHighAccuracy: true,
                },
              ),
          );
        }

        if (!coordinates) {
          startTransition(() => {
            setSessionLocationResolved(true);
          });
          return;
        }

        const location = await reverseGeocodeForSession(coordinates);
        if (location) {
          setSessionLocation(location);
        }
      } catch (error) {
        console.error("Error resolving homepage session location:", error);
        posthog.captureException(error);
      } finally {
        setSessionLocationResolved(true);
      }
    };

    void resolveSessionLocation();
  }, [sessionLocationResolved, viewer]);

  const collectionQueries = useMemo(
    () =>
      Object.fromEntries(
        HOME_PAGE_ROW_CONFIG.map((row) => [
          row.key,
          {
            query: api.organizations.getOrganizationCollection,
            args: {
              collectionKey: row.key,
              filters: getCollectionFilters(row, sessionLocation?.state),
              sessionSeed,
            },
          },
        ]),
      ),
    [sessionLocation?.state, sessionSeed],
  );
  const rowResults = useQueries(collectionQueries);

  // Search query
  const searchResults = useQuery(
    api.organizations.search,
    isSearching ? { query: debouncedQuery } : "skip",
  );

  const isSearchLoading = isSearching && searchResults === undefined;
  const rowError = Object.values(rowResults).find(
    (result): result is Error => result instanceof Error,
  );
  if (rowError) {
    throw rowError;
  }

  const isLoadingRows = Object.values(rowResults).some(
    (organizations) => organizations === undefined,
  );

  const handleCardClick = useCallback(
    (org: Organization) => {
      setSelectedOrg(org);
      setIsModalOpen(true);

      posthog.capture("organization_details_viewed", {
        organization_id: org.slug,
        organization_name: org.name,
        organization_ein: org.ein,
        organization_city: org.city,
        organization_state: org.state,
        source: isSearching ? "search_results" : "category_row",
        search_query: isSearching ? debouncedQuery : undefined,
      });
    },
    [isSearching, debouncedQuery],
  );

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrg(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.length > 0) {
      posthog.capture("search_initiated", {
        query_length: value.length,
      });
    }
  };

  const categoryRows = HOME_PAGE_ROW_CONFIG.map((row) => ({
    key: row.key,
    title: row.title,
    organizations: (rowResults[row.key] as Organization[] | undefined) ?? [],
  }));

  // Filter out empty categories
  const visibleRows = categoryRows.filter(
    (row) => row.organizations.length > 0,
  );

  return (
    <>
      {/* Hero Section */}
      <section className="px-4 pt-8 pb-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex flex-col items-center gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Find Your Cause
              </h1>
              <p className="mt-2 text-lg text-white/70">
                Discover nonprofits that align with your values
              </p>
            </div>
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto w-full max-w-xl"
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                {isSearchLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                ) : (
                  <Search className="h-5 w-5 text-white/50" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search nonprofits..."
                className="h-14 w-full rounded-full border border-white/20 bg-white/10 pr-14 pl-14 text-base backdrop-blur-md transition-all placeholder:text-white/40 focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 focus:outline-none"
                aria-label="Search nonprofits"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-5 transition-opacity hover:opacity-70"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5 text-white/50" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="pb-16">
        <AnimatePresence mode="wait">
          {isSearching ? (
            /* Search Results */
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-6xl px-4"
            >
              {/* Results count */}
              {searchResults && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 text-sm text-white/60"
                >
                  {searchResults.length === 0
                    ? `No results for "${debouncedQuery}"`
                    : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${debouncedQuery}"`}
                </motion.p>
              )}

              {/* Search loading state */}
              {isSearchLoading && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[220px] animate-pulse rounded-xl border border-white/10 bg-white/5"
                    />
                  ))}
                </div>
              )}

              {/* Search results grid */}
              {searchResults && searchResults.length > 0 && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {searchResults.map((org, index) => (
                    <motion.div
                      key={org._id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(index * 0.03, 0.2),
                      }}
                    >
                      <div
                        onClick={() => handleCardClick(org)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleCardClick(org);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="group h-full cursor-pointer overflow-hidden rounded-xl border border-white/20 bg-white/10 p-0 shadow-lg backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-white/10"
                      >
                        <div className="relative h-32 w-full bg-gray-100">
                          {org.logoUrl ? (
                            <Image
                              src={org.logoUrl}
                              alt={org.name}
                              fill
                              className="object-contain"
                              unoptimized
                              loading="eager"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
                              <span className="text-3xl font-bold text-white">
                                {org.name
                                  .split(" ")
                                  .map((word) => word[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                        </div>
                        <div className="p-3">
                          <h3 className="line-clamp-1 font-semibold">
                            {org.name}
                          </h3>
                          <p className="text-muted-foreground line-clamp-1 text-xs">
                            {org.city}, {org.state}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty search state */}
              {searchResults && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="mb-4 h-12 w-12 text-white/20" />
                  <p className="text-white/60">
                    No nonprofits found matching your search
                  </p>
                  <button
                    onClick={() => handleSearchChange("")}
                    className="mt-4 text-sm text-white/40 underline underline-offset-4 hover:text-white/60"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Category Rows */
            <motion.div
              key="category-rows"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Loading skeleton for rows */}
              {isLoadingRows && (
                <div className="space-y-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <div className="px-4 md:px-14">
                        <div className="h-7 w-48 animate-pulse rounded-lg bg-white/10" />
                      </div>
                      <div className="scrollbar-hide flex gap-4 overflow-hidden pl-4 md:pl-14">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <div
                            key={j}
                            className="h-[220px] w-[260px] flex-shrink-0 animate-pulse rounded-xl border border-white/10 bg-white/5 sm:w-[280px]"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actual category rows */}
              {!isLoadingRows &&
                visibleRows.map((row, index) => (
                  <CategoryRow
                    key={row.key}
                    title={row.title}
                    organizations={row.organizations}
                    onCardClick={handleCardClick}
                    delay={index * 0.1}
                  />
                ))}

              {/* Empty state if no rows have data */}
              {!isLoadingRows && visibleRows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Compass className="mb-4 h-12 w-12 text-white/20" />
                  <p className="text-white/60">
                    No organizations available yet
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Organization Modal */}
      {selectedOrg && (
        <OrganizationModal
          organization={selectedOrg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          showRemoveButton={false}
        />
      )}
    </>
  );
}
