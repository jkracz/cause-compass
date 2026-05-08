import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  BROWSE_CATEGORIES,
  type BrowseCategory,
} from "@/lib/browse-categories";
import { SectionHeader } from "@/components/editorial/section-header";

export function CategoryMosaic() {
  return (
    <section className="space-y-7">
      <SectionHeader
        kicker="Browse by cause"
        title={
          <>
            Pick a thread, follow it{" "}
            <span className="italic text-[var(--accent)] font-medium">
              everywhere
            </span>
            .
          </>
        }
        subtitle="Six broad lanes across the index — each opens onto a deeper, alphabetical roll of every nonprofit we've vetted."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BROWSE_CATEGORIES.map((category, index) => (
          <MosaicTile
            key={category.slug}
            category={category}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function MosaicTile({
  category,
  index,
}: {
  category: BrowseCategory;
  index: number;
}) {
  return (
    <Link
      href={`/browse/${category.slug}`}
      className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-[var(--rule)] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_28px_60px_-32px_rgba(91,75,158,0.4)]"
      style={{
        backgroundColor: category.accentInk,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${category.accent}22 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <span
          aria-hidden
          className="font-heading text-[3.4rem] leading-none transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110"
          style={{ color: category.accent }}
        >
          {category.glyph}
        </span>
        <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--ink-mute)]">
          0{index + 1}
        </span>
      </div>

      <div className="relative z-10 mt-6 flex flex-col gap-2.5">
        <h3 className="font-heading text-[22px] leading-[1.1] font-semibold text-[var(--ink)]">
          {category.label}
        </h3>
        <p className="line-clamp-2 text-[13px] leading-[1.5] text-[var(--ink-soft)]">
          {category.description}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.22em] uppercase">
          <span style={{ color: category.accent }}>Explore</span>
          <ArrowUpRight
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            style={{ color: category.accent }}
          />
        </div>
      </div>

      <span
        aria-hidden
        className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 transition-transform duration-700 group-hover:scale-x-100"
        style={{ backgroundColor: category.accent }}
      />
    </Link>
  );
}
