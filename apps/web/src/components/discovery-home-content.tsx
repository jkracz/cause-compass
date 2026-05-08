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
import posthog from "posthog-js";
import { Compass, Search } from "lucide-react";

import { OrganizationModal } from "@/components/organization-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { CATEGORY_ROW_TITLES } from "@/lib/ntee-labels";
import { getWeekKey } from "@/lib/week-key";
import { api } from "@cause/backend/convex/_generated/api";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { useAppSession } from "@/components/app-session-provider";
import {
  reverseGeocodeForSession,
  type SessionLocation,
} from "@/app/discover/actions";
import {
  CauseOfTheWeek,
  CauseOfTheWeekSkeleton,
} from "@/components/editorial/cause-of-the-week";
import { EditorialSearch } from "@/components/editorial/editorial-search";
import {
  SpotlightTrio,
  SpotlightTrioSkeleton,
} from "@/components/editorial/spotlight-trio";
import { CategoryMosaic } from "@/components/editorial/category-mosaic";
import { ScaleStrip, ScaleStripSkeleton } from "@/components/editorial/scale-strip";
import { EditorialCarousel } from "@/components/editorial/editorial-carousel";
import { EditorialOrgCard } from "@/components/editorial/editorial-org-card";

type Organization = Doc<"organizations">;
type StoredCoordinates = {
  latitude: number;
  longitude: number;
};

const HOMEPAGE_CAROUSELS = [
  {
    key: "artsAndCulture",
    kicker: "On the cultural calendar",
    title: CATEGORY_ROW_TITLES.artsAndCulture,
    subtitle:
      "Museums, theaters, archives, and the people who keep our shared culture alive.",
    filters: { nteeMajors: ["A"] },
    browseHref: "/browse/arts-culture",
    position: "upper" as const,
  },
  {
    key: "education",
    kicker: "Investing in minds",
    title: CATEGORY_ROW_TITLES.education,
    subtitle:
      "Classrooms, scholarships, after-school programs — long-arc work measured in lifetimes.",
    filters: { nteeMajors: ["B"] },
    browseHref: "/browse/education",
    position: "upper" as const,
  },
  {
    key: "healthAndWellness",
    kicker: "On the front lines",
    title: CATEGORY_ROW_TITLES.healthAndWellness,
    subtitle:
      "Clinics, patient services, community health workers — care delivered where it's needed.",
    filters: { nteeMajors: ["E", "F"] },
    browseHref: "/browse/health-care",
    position: "lower" as const,
  },
  {
    key: "environmentAndAnimals",
    kicker: "For the natural world",
    title: CATEGORY_ROW_TITLES.environmentAndAnimals,
    subtitle:
      "Conservation, wildlife, climate, and stewards of the land we all share.",
    filters: { nteeMajors: ["C", "D"] },
    browseHref: "/browse/environment",
    position: "lower" as const,
  },
] satisfies {
  key: string;
  kicker: string;
  title: string;
  subtitle: string;
  filters: { nteeMajors: string[] };
  browseHref: string;
  position: "upper" | "lower";
}[];

function createSessionSeed() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
}

function parseStoredCoordinates(location?: string): StoredCoordinates | null {
  if (!location?.trim()) return null;
  try {
    const parsed = JSON.parse(location) as {
      latitude?: unknown;
      longitude?: unknown;
    };
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
  } catch {
    return null;
  }
  return null;
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

  const weekKey = useMemo(() => getWeekKey(), []);

  useEffect(() => {
    if (viewer === undefined || sessionLocationResolved) return;

    const storedLocation = viewer?.preferences.location;
    if (
      !storedLocation ||
      storedLocation === "skipped" ||
      storedLocation === "denied" ||
      storedLocation === "unavailable"
    ) {
      startTransition(() => setSessionLocationResolved(true));
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
                (pos) =>
                  resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  }),
                reject,
                { timeout: 10000, enableHighAccuracy: true },
              ),
          );
        }
        if (!coordinates) {
          startTransition(() => setSessionLocationResolved(true));
          return;
        }
        const location = await reverseGeocodeForSession(coordinates);
        if (location) setSessionLocation(location);
      } catch (error) {
        console.error("Error resolving homepage session location:", error);
        posthog.captureException(error);
      } finally {
        setSessionLocationResolved(true);
      }
    };

    void resolveSessionLocation();
  }, [sessionLocationResolved, viewer]);

  // Cause of the Week + Editor's Picks
  const causeOfTheWeek = useQuery(api.organizations.getCauseOfTheWeek, {
    weekKey,
    sessionLocationState: sessionLocation?.state,
  });
  const editorsPicks = useQuery(api.organizations.getEditorsPicks, {
    weekKey,
    excludeSlugs: causeOfTheWeek ? [causeOfTheWeek.slug] : [],
  });
  const scaleData = useQuery(api.organizations.getOrganizationsByScale, {
    weekKey,
  });

  // Carousels
  const collectionQueries = useMemo(
    () =>
      Object.fromEntries(
        HOMEPAGE_CAROUSELS.map((row) => [
          row.key,
          {
            query: api.organizations.getOrganizationCollection,
            args: {
              collectionKey: row.key,
              filters: row.filters,
              sessionSeed,
            },
          },
        ]),
      ),
    [sessionSeed],
  );
  const rowResults = useQueries(collectionQueries);

  const searchResults = useQuery(
    api.organizations.search,
    isSearching ? { query: debouncedQuery } : "skip",
  );

  const isSearchLoading = isSearching && searchResults === undefined;

  const rowError = Object.values(rowResults).find(
    (result): result is Error => result instanceof Error,
  );
  if (rowError) throw rowError;

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
        source: isSearching ? "search_results" : "editorial",
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
      posthog.capture("search_initiated", { query_length: value.length });
    }
  };

  const upperCarousels = HOMEPAGE_CAROUSELS.filter(
    (row) => row.position === "upper",
  ).map((row) => ({
    ...row,
    organizations: (rowResults[row.key] as Organization[] | undefined) ?? [],
  }));
  const lowerCarousels = HOMEPAGE_CAROUSELS.filter(
    (row) => row.position === "lower",
  ).map((row) => ({
    ...row,
    organizations: (rowResults[row.key] as Organization[] | undefined) ?? [],
  }));

  return (
    <main className="paper-grain relative min-h-screen overflow-hidden">
      {/* soft accent backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
      >
        <div className="absolute -top-40 left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-[var(--accent-soft)] opacity-60 blur-3xl" />
        <div className="absolute -top-20 right-0 h-[40vh] w-[40vh] rounded-full bg-[var(--accent-2)]/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 md:px-8 md:pt-14">
        {/* Editorial masthead — small kicker above hero */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--rule)] pb-4">
          <span className="font-heading text-[11px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
            The Compass · Vol. {new Date().getUTCFullYear() - 2024}
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--ink-mute)]">
            {weekKey}
          </span>
        </div>

        {/* Hero: Cause of the Week */}
        <div className="editorial-fade-up">
          {causeOfTheWeek === undefined && <CauseOfTheWeekSkeleton />}
          {causeOfTheWeek === null && (
            <EmptyEditorialState message="No featured organization available this week." />
          )}
          {causeOfTheWeek && (
            <CauseOfTheWeek
              organization={causeOfTheWeek}
              onLearnMore={handleCardClick}
            />
          )}
        </div>

        {/* Search bar — under hero */}
        <div className="editorial-fade-up mt-14" style={{ animationDelay: "0.1s" }}>
          <EditorialSearch
            value={searchQuery}
            onChange={handleSearchChange}
            isLoading={isSearchLoading}
          />
        </div>

        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.section
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-12"
            >
              {searchResults && (
                <p className="mb-6 text-[12px] font-semibold tracking-[0.22em] text-[var(--ink-mute)] uppercase">
                  {searchResults.length === 0
                    ? `No matches for "${debouncedQuery}"`
                    : `${searchResults.length} result${
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

              {searchResults && searchResults.length > 0 && (
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

              {searchResults && searchResults.length === 0 && (
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
            </motion.section>
          ) : (
            <motion.div
              key="editorial-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-20 space-y-20"
            >
              {/* Editor's Picks */}
              <div className="editorial-fade-up">
                {editorsPicks === undefined ? (
                  <SpotlightTrioSkeleton />
                ) : (
                  <SpotlightTrio
                    picks={editorsPicks}
                    onCardClick={handleCardClick}
                  />
                )}
              </div>

              {/* Browse by Cause */}
              <div className="editorial-fade-up">
                <CategoryMosaic />
              </div>

              {/* Upper carousels */}
              {upperCarousels.map((row) => (
                <div key={row.key} className="editorial-fade-up">
                  {row.organizations.length === 0 ? (
                    <CarouselSkeleton title={row.title} kicker={row.kicker} />
                  ) : (
                    <EditorialCarousel
                      kicker={row.kicker}
                      title={row.title}
                      subtitle={row.subtitle}
                      organizations={row.organizations}
                      onCardClick={handleCardClick}
                      browseHref={row.browseHref}
                      rowKey={row.key}
                    />
                  )}
                </div>
              ))}

              {/* Find Your Scale */}
              <div className="editorial-fade-up">
                {scaleData === undefined ? (
                  <ScaleStripSkeleton />
                ) : (
                  <ScaleStrip data={scaleData} onCardClick={handleCardClick} />
                )}
              </div>

              {/* Lower carousels */}
              {lowerCarousels.map((row) => (
                <div key={row.key} className="editorial-fade-up">
                  {row.organizations.length === 0 ? (
                    <CarouselSkeleton title={row.title} kicker={row.kicker} />
                  ) : (
                    <EditorialCarousel
                      kicker={row.kicker}
                      title={row.title}
                      subtitle={row.subtitle}
                      organizations={row.organizations}
                      onCardClick={handleCardClick}
                      browseHref={row.browseHref}
                      rowKey={row.key}
                    />
                  )}
                </div>
              ))}

              {/* Empty state */}
              {causeOfTheWeek === null &&
                editorsPicks?.length === 0 &&
                upperCarousels.every((r) => r.organizations.length === 0) && (
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

      {selectedOrg && (
        <OrganizationModal
          organization={selectedOrg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          showRemoveButton={false}
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

function CarouselSkeleton({
  title,
  kicker,
}: {
  title: string;
  kicker: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <span className="text-[10px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
          {kicker}
        </span>
        <h2 className="font-heading mt-2 text-[clamp(1.75rem,2.5vw,2.5rem)] font-semibold text-[var(--ink)]">
          {title}
        </h2>
      </div>
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
