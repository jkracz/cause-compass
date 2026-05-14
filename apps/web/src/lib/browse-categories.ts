export type GeographicFocus = "Global" | "National" | "Regional" | "Local";

export type BrowseCategory = {
  slug: string;
  label: string;
  description: string;
  accent: string;
  accentInk: string;
  prominence?: "featured" | "standard";
  nteeMajors: (string | null)[];
};

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  {
    slug: "arts-culture",
    label: "Arts & Culture",
    description:
      "Museums, theaters, galleries, performing arts, and the makers keeping culture alive.",
    accent: "#C58F5A",
    accentInk: "#FFF4E6",
    prominence: "featured",
    nteeMajors: ["A"],
  },
  {
    slug: "education-youth",
    label: "Education & Youth",
    description:
      "Classrooms, scholarships, after-school programs, and youth development.",
    accent: "#5A7A8E",
    accentInk: "#EAF1F6",
    prominence: "featured",
    nteeMajors: ["B", "O"],
  },
  {
    slug: "health-mental-health",
    label: "Health & Mental Health",
    description:
      "Care, counseling, patient services, disease support, and medical research.",
    accent: "#8E5C4A",
    accentInk: "#F8E9E2",
    prominence: "featured",
    nteeMajors: ["E", "F", "G", "H"],
  },
  {
    slug: "environment-animals",
    label: "Environment & Animals",
    description:
      "Conservation, climate, clean water, wildlife, and animal welfare.",
    accent: "#5C7A5E",
    accentInk: "#E8F0E9",
    prominence: "featured",
    nteeMajors: ["C", "D"],
  },
  {
    slug: "human-services",
    label: "Human Services",
    description:
      "Direct support for people navigating need, crisis, care, and recovery.",
    accent: "#8E6F4F",
    accentInk: "#F4ECDF",
    prominence: "featured",
    nteeMajors: ["P"],
  },
  {
    slug: "housing-community",
    label: "Housing & Community",
    description:
      "Shelter, neighborhood development, and stronger local infrastructure.",
    accent: "#7B6C9B",
    accentInk: "#EEE9F6",
    prominence: "featured",
    nteeMajors: ["L", "S"],
  },
  {
    slug: "food-agriculture",
    label: "Food & Agriculture",
    description: "Food security, farms, nutrition, and resilient food systems.",
    accent: "#8A7A42",
    accentInk: "#F2EEDB",
    nteeMajors: ["K"],
  },
  {
    slug: "civil-rights-legal-aid",
    label: "Civil Rights & Legal Aid",
    description: "Legal support, civil liberties, advocacy, and justice work.",
    accent: "#7C5363",
    accentInk: "#F2E5EA",
    nteeMajors: ["I", "R"],
  },
  {
    slug: "work-economic-opportunity",
    label: "Work & Economic Opportunity",
    description: "Jobs, workforce development, and economic mobility.",
    accent: "#4F7180",
    accentInk: "#E5EEF2",
    nteeMajors: ["J"],
  },
  {
    slug: "public-safety-disaster-response",
    label: "Public Safety & Disaster Response",
    description: "Preparedness, emergency response, and safer communities.",
    accent: "#775A47",
    accentInk: "#F0E7E0",
    nteeMajors: ["M"],
  },
  {
    slug: "recreation-sports",
    label: "Recreation & Sports",
    description: "Play, physical activity, parks, clubs, and community leagues.",
    accent: "#4F765C",
    accentInk: "#E5F0E8",
    nteeMajors: ["N"],
  },
  {
    slug: "international-affairs",
    label: "International Affairs",
    description: "Cross-border aid, exchange, development, and diplomacy.",
    accent: "#5E5470",
    accentInk: "#EBE6F1",
    nteeMajors: ["Q"],
  },
  {
    slug: "science-tech-research",
    label: "Science, Tech & Research",
    description: "Scientific inquiry, technology, and social research.",
    accent: "#566A83",
    accentInk: "#E8EEF5",
    nteeMajors: ["U", "V"],
  },
  {
    slug: "philanthropy-public-benefit",
    label: "Philanthropy & Public Benefit",
    description: "Giving, volunteering, civic institutions, and public support.",
    accent: "#8B5874",
    accentInk: "#F3E6EE",
    nteeMajors: ["T", "W"],
  },
  {
    slug: "faith-based-religious",
    label: "Faith-Based & Religious Organizations",
    description: "Faith communities, spiritual support, and religious service.",
    accent: "#74624F",
    accentInk: "#EFE9E2",
    nteeMajors: ["X"],
  },
  {
    slug: "membership-mutual-benefit",
    label: "Membership & Mutual Benefit",
    description: "Member-serving associations and mutual benefit organizations.",
    accent: "#6B6B56",
    accentInk: "#EDEDE2",
    nteeMajors: ["Y"],
  },
  {
    slug: "other",
    label: "Other",
    description: "Organizations without a clear cause classification yet.",
    accent: "#6B6273",
    accentInk: "#ECE8F0",
    nteeMajors: ["Z", null],
  },
];

export function getBrowseCategory(slug: string): BrowseCategory | undefined {
  return BROWSE_CATEGORIES.find((category) => category.slug === slug);
}
