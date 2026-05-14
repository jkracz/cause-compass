import Link from "next/link";
import {
  BROWSE_CATEGORIES,
  type BrowseCategory,
} from "@/lib/browse-categories";
import { cn } from "@/lib/utils";

const HATCH_BACKGROUND =
  "repeating-linear-gradient(135deg, transparent 0, transparent 5px, rgba(240, 230, 245, 0.09) 5px, rgba(240, 230, 245, 0.09) 6px)";

export function CategoryMosaic() {
  const featuredCategories = BROWSE_CATEGORIES.filter(
    (category) => category.prominence === "featured",
  );
  const standardCategories = BROWSE_CATEGORIES.filter(
    (category) => category.prominence !== "featured",
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuredCategories.map((category) => (
          <MosaicTile
            key={category.slug}
            category={category}
            variant="featured"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {standardCategories.map((category) => (
          <MosaicTile
            key={category.slug}
            category={category}
            variant="standard"
          />
        ))}
      </div>
    </div>
  );
}

function MosaicTile({
  category,
  variant,
}: {
  category: BrowseCategory;
  variant: "featured" | "standard";
}) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/browse/${category.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(91,75,158,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        isFeatured
          ? "min-h-[220px] justify-end p-7"
          : "min-h-[138px] justify-between p-5",
      )}
      style={{ backgroundColor: category.accent }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: HATCH_BACKGROUND }}
      />

      <div className="relative z-10 space-y-3">
        <h3
          className={cn(
            "font-heading leading-[1.05] font-semibold text-[var(--paper)]",
            isFeatured ? "text-[clamp(1.5rem,2.1vw,2rem)]" : "text-[20px]",
          )}
        >
          {category.label}
        </h3>
        <p
          className={cn(
            "max-w-[28ch] text-[var(--paper)]/82",
            isFeatured
              ? "text-[13px] leading-[1.45]"
              : "text-[12px] leading-[1.35]",
          )}
        >
          {category.description}
        </p>
      </div>

      <span
        aria-hidden
        className="absolute right-0 bottom-0 left-0 h-px origin-left scale-x-0 bg-[var(--paper)]/65 transition-transform duration-700 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
      />
    </Link>
  );
}
