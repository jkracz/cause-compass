"use client";

import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { BROWSE_CATEGORIES } from "@/lib/browse-categories";

interface EditorialSearchProps {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
}

export function EditorialSearch({
  value,
  onChange,
  isLoading,
}: EditorialSearchProps) {
  return (
    <div className="space-y-4">
      <label className="relative block">
        <span className="sr-only">Search nonprofits</span>
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-[var(--ink-mute)]">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search 200,000+ vetted nonprofits…"
          className="font-heading h-16 w-full rounded-full border border-[var(--rule-strong)] bg-white/80 pr-14 pl-14 text-[16px] text-[var(--ink)] backdrop-blur transition-all placeholder:text-[var(--ink-mute)]/80 focus:border-[var(--accent)]/50 focus:bg-white focus:shadow-[0_18px_50px_-30px_rgba(200,38,110,0.45)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/12"
          aria-label="Search nonprofits"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-y-0 right-0 flex items-center pr-5 text-[var(--ink-mute)] transition-opacity hover:text-[var(--ink)]"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </label>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-soft)]">
        <span className="font-semibold tracking-[0.22em] text-[var(--ink-mute)] uppercase">
          Browse:
        </span>
        {BROWSE_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/browse/${cat.slug}`}
            className="rounded-full border border-[var(--rule)] bg-white/60 px-3 py-1 font-medium tracking-wide transition hover:border-[var(--accent)]/40 hover:bg-white hover:text-[var(--accent)]"
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
