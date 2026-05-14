"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@cause/backend/convex/_generated/api";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import type { BrowseCategory } from "@/lib/browse-categories";
import { EditorialOrgCard } from "@/components/editorial/editorial-org-card";
import { OrganizationModal } from "@/components/organization-modal";
import { cn } from "@/lib/utils";

type Organization = Doc<"organizations">;

const US_STATES: { code: string; label: string }[] = [
  { code: "AL", label: "Alabama" },
  { code: "AK", label: "Alaska" },
  { code: "AZ", label: "Arizona" },
  { code: "AR", label: "Arkansas" },
  { code: "CA", label: "California" },
  { code: "CO", label: "Colorado" },
  { code: "CT", label: "Connecticut" },
  { code: "DE", label: "Delaware" },
  { code: "DC", label: "District of Columbia" },
  { code: "FL", label: "Florida" },
  { code: "GA", label: "Georgia" },
  { code: "HI", label: "Hawaii" },
  { code: "ID", label: "Idaho" },
  { code: "IL", label: "Illinois" },
  { code: "IN", label: "Indiana" },
  { code: "IA", label: "Iowa" },
  { code: "KS", label: "Kansas" },
  { code: "KY", label: "Kentucky" },
  { code: "LA", label: "Louisiana" },
  { code: "ME", label: "Maine" },
  { code: "MD", label: "Maryland" },
  { code: "MA", label: "Massachusetts" },
  { code: "MI", label: "Michigan" },
  { code: "MN", label: "Minnesota" },
  { code: "MS", label: "Mississippi" },
  { code: "MO", label: "Missouri" },
  { code: "MT", label: "Montana" },
  { code: "NE", label: "Nebraska" },
  { code: "NV", label: "Nevada" },
  { code: "NH", label: "New Hampshire" },
  { code: "NJ", label: "New Jersey" },
  { code: "NM", label: "New Mexico" },
  { code: "NY", label: "New York" },
  { code: "NC", label: "North Carolina" },
  { code: "ND", label: "North Dakota" },
  { code: "OH", label: "Ohio" },
  { code: "OK", label: "Oklahoma" },
  { code: "OR", label: "Oregon" },
  { code: "PA", label: "Pennsylvania" },
  { code: "RI", label: "Rhode Island" },
  { code: "SC", label: "South Carolina" },
  { code: "SD", label: "South Dakota" },
  { code: "TN", label: "Tennessee" },
  { code: "TX", label: "Texas" },
  { code: "UT", label: "Utah" },
  { code: "VT", label: "Vermont" },
  { code: "VA", label: "Virginia" },
  { code: "WA", label: "Washington" },
  { code: "WV", label: "West Virginia" },
  { code: "WI", label: "Wisconsin" },
  { code: "WY", label: "Wyoming" },
];

const GEO_CHIPS: ("Local" | "Regional" | "National" | "Global")[] = [
  "Local",
  "Regional",
  "National",
  "Global",
];

interface BrowseCategoryContentProps {
  category: BrowseCategory;
}

export function BrowseCategoryContent({
  category,
}: BrowseCategoryContentProps) {
  const [stateFilter, setStateFilter] = useState<string>("");
  const [hasLogoFilter, setHasLogoFilter] = useState<boolean>(false);
  const [geoFilter, setGeoFilter] = useState<
    "Local" | "Regional" | "National" | "Global" | null
  >(null);

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryArgs = useMemo(() => {
    if (category.kind === "ntee") {
      return {
        kind: "ntee" as const,
        nteeMajor: category.nteeMajor,
        state: stateFilter || undefined,
        hasLogo: hasLogoFilter || undefined,
      };
    }
    return {
      kind: "geo" as const,
      geographicFocus: geoFilter ?? category.geographicFocus,
      state: stateFilter || undefined,
      hasLogo: hasLogoFilter || undefined,
    };
  }, [category, stateFilter, hasLogoFilter, geoFilter]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.organizations.listByCategoryPaginated,
    queryArgs,
    { initialNumItems: 24 },
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && status === "CanLoadMore") {
          loadMore(24);
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [status, loadMore]);

  const handleCardClick = useCallback((org: Organization) => {
    setSelectedOrg(org);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrg(null);
  };

  return (
    <>
      {/* Hero band */}
      <header
        className="relative overflow-hidden border-b border-[var(--rule)]"
        style={{ backgroundColor: category.accentInk }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at 80% 0%, ${category.accent}33 0%, transparent 60%)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.22em] text-[var(--ink-soft)] uppercase transition hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="font-heading text-[clamp(2.4rem,5vw,4rem)] leading-[1] font-semibold text-[var(--ink)]">
                {category.label}
              </h1>
              <p className="max-w-xl text-[15px] leading-[1.55] text-[var(--ink-soft)]">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* Filter row */}
        <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--rule)] bg-white/70 p-3 backdrop-blur">
          {category.kind === "geo" && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 text-[10px] font-semibold tracking-[0.22em] text-[var(--ink-mute)] uppercase">
                Reach
              </span>
              {GEO_CHIPS.map((chip) => {
                const isActive =
                  (geoFilter ?? category.geographicFocus) === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setGeoFilter(chip)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[12px] font-medium transition",
                      isActive
                        ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--rule)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent)]/40",
                    )}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          )}

          <label className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.22em] text-[var(--ink-mute)] uppercase">
              State
            </span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-full border border-[var(--rule)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--ink-soft)] focus:border-[var(--accent)]/50 focus:outline-none"
            >
              <option value="">All states</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setHasLogoFilter((prev) => !prev)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
              hasLogoFilter
                ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
                : "border-[var(--rule)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent)]/40",
            )}
          >
            {hasLogoFilter ? "✓ With logos only" : "Show all"}
          </button>

          {(stateFilter || hasLogoFilter || geoFilter) && (
            <button
              type="button"
              onClick={() => {
                setStateFilter("");
                setHasLogoFilter(false);
                setGeoFilter(null);
              }}
              className="ml-auto text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-mute)] uppercase underline-offset-4 hover:text-[var(--accent)] hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {status === "LoadingFirstPage" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[300px] animate-pulse rounded-[1.25rem] bg-[var(--paper-deep)]"
              />
            ))}
          </div>
        )}

        {status !== "LoadingFirstPage" && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--rule)] bg-white/40 px-6 py-20 text-center">
            <p className="font-heading text-[20px] font-semibold text-[var(--ink)]">
              No nonprofits matched these filters.
            </p>
            <p className="mt-2 text-[14px] text-[var(--ink-soft)]">
              Try widening the state or clearing the &quot;with logos only&quot;
              toggle.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((org) => (
              <EditorialOrgCard
                key={org._id}
                organization={org}
                onClick={() => handleCardClick(org)}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-12 w-full" aria-hidden />

        {status === "LoadingMore" && (
          <div className="flex justify-center py-8 text-[var(--ink-mute)]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {status === "Exhausted" && results.length > 0 && (
          <div className="py-12 text-center text-[11px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
            — End of list —
          </div>
        )}
      </div>

      {selectedOrg && (
        <OrganizationModal
          organization={selectedOrg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
