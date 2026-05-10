export type GeographicFocus = "Global" | "National" | "Regional" | "Local";

export type BrowseCategory = {
  slug: string;
  label: string;
  description: string;
  glyph: string;
  accent: string;
  accentInk: string;
  kind: "ntee" | "geo";
  nteeMajor?: string;
  geographicFocus?: GeographicFocus;
  preferSessionState?: boolean;
};

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  {
    slug: "arts-culture",
    label: "Arts & Culture",
    description:
      "Museums, theaters, galleries, performing arts, and the makers keeping culture alive.",
    glyph: "◆",
    accent: "#C58F5A",
    accentInk: "#FFF4E6",
    kind: "ntee",
    nteeMajor: "A",
  },
  {
    slug: "education",
    label: "Education & Learning",
    description:
      "Classrooms, scholarships, after-school programs, and education built for the long arc.",
    glyph: "✱",
    accent: "#5A7A8E",
    accentInk: "#EAF1F6",
    kind: "ntee",
    nteeMajor: "B",
  },
  {
    slug: "health-care",
    label: "Health Care",
    description:
      "Hospitals, clinics, patient services, and the people delivering care where it's needed.",
    glyph: "✚",
    accent: "#8E5C4A",
    accentInk: "#F8E9E2",
    kind: "ntee",
    nteeMajor: "E",
  },
  {
    slug: "environment",
    label: "Environment",
    description:
      "Conservation, climate, clean water, wildlife, and the stewardship of place.",
    glyph: "❋",
    accent: "#5C7A5E",
    accentInk: "#E8F0E9",
    kind: "ntee",
    nteeMajor: "C",
  },
  {
    slug: "global-impact",
    label: "Making Global Impact",
    description:
      "Cross-border missions reaching communities far from where most of us live.",
    glyph: "◐",
    accent: "#5E5470",
    accentInk: "#EBE6F1",
    kind: "geo",
    geographicFocus: "Global",
  },
  {
    slug: "local-community",
    label: "Your Local Community",
    description:
      "Neighborhood-rooted nonprofits, the kind you can volunteer with on a Saturday.",
    glyph: "◉",
    accent: "#8E6F4F",
    accentInk: "#F4ECDF",
    kind: "geo",
    geographicFocus: "Local",
    preferSessionState: true,
  },
];

export function getBrowseCategory(slug: string): BrowseCategory | undefined {
  return BROWSE_CATEGORIES.find((category) => category.slug === slug);
}
