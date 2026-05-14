import Link from "next/link";
import {
  BROWSE_CATEGORIES,
  type BrowseCategory,
} from "@/lib/browse-categories";

const HATCH_BACKGROUND =
  "repeating-linear-gradient(135deg, transparent 0, transparent 5px, rgba(240, 230, 245, 0.09) 5px, rgba(240, 230, 245, 0.09) 6px)";

export function CategoryMosaic() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {BROWSE_CATEGORIES.map((category) => (
        <MosaicTile key={category.slug} category={category} />
      ))}
    </div>
  );
}

function MosaicTile({ category }: { category: BrowseCategory }) {
  return (
    <Link
      href={`/browse/${category.slug}`}
      className="group relative flex h-full min-h-[260px] flex-col justify-end overflow-hidden rounded-[1.5rem] p-7 transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(91,75,158,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ backgroundColor: category.accent }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: HATCH_BACKGROUND }}
      />

      <span
        aria-hidden
        className="font-heading pointer-events-none absolute top-6 right-6 text-[18px] leading-none text-[var(--paper)]/55"
      >
        {category.glyph}
      </span>

      <h3 className="font-heading relative z-10 text-[clamp(1.5rem,2.1vw,2rem)] leading-[1.05] font-semibold text-[var(--paper)]">
        {category.label}
      </h3>

      <span
        aria-hidden
        className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-[var(--paper)]/65 transition-transform duration-700 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
      />
    </Link>
  );
}
