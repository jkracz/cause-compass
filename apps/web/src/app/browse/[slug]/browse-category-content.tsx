"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { api } from "@cause/backend/convex/_generated/api";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import type { BrowseCategory, GeographicFocus } from "@/lib/browse-categories";
import { EditorialOrgCard } from "@/components/editorial/editorial-org-card";
import { DynamicOrganizationModal } from "@/components/dynamic-organization-modal";
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

const REACH_FILTERS: GeographicFocus[] = [
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
  const [stateFilters, setStateFilters] = useState<string[]>([]);
  const [reachFilters, setReachFilters] = useState<GeographicFocus[]>([]);

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryArgs = useMemo(() => {
    return {
      kind: "ntee" as const,
      nteeMajors: category.nteeMajors,
      geographicFocuses:
        reachFilters.length > 0 ? reachFilters : undefined,
      states: stateFilters.length > 0 ? stateFilters : undefined,
    };
  }, [category, reachFilters, stateFilters]);

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

  const toggleReachFilter = (reach: GeographicFocus) => {
    setReachFilters((current) =>
      current.includes(reach)
        ? current.filter((value) => value !== reach)
        : [...current, reach],
    );
  };

  const toggleStateFilter = (state: string) => {
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
                setStateFilters([]);
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
              Try widening the reach or HQ state.
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
        <DynamicOrganizationModal
          organization={selectedOrg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
