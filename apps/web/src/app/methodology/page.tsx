import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BROWSE_CATEGORIES } from "@/lib/browse-categories";

export const metadata: Metadata = {
  title: "Methodology | Cause Compass",
  description:
    "How Cause Compass turns public nonprofit data, IRS codes, web crawling, and AI-assisted enrichment into a calmer nonprofit discovery experience.",
  alternates: {
    canonical: "/methodology",
  },
};

const IRS_LINKS = [
  {
    label: "IRS Exempt Organizations Business Master File extracts",
    href: "https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf",
  },
  {
    label: "IRS Tax Exempt Organization Search bulk data",
    href: "https://www.irs.gov/charities-non-profits/tax-exempt-organization-search-bulk-data-downloads",
  },
  {
    label: "IRS EO File documentation",
    href: "https://www.irs.gov/pub/irs-tege/p4838.pdf",
  },
  {
    label: "NTEE code reference",
    href: "https://nccs.urban.org/project/national-taxonomy-exempt-entities-ntee-codes",
  },
  {
    label: "IRS activity code reference",
    href: "https://nccs.urban.org/publication/irs-activity-codes",
  },
];

const PIPELINE_STEPS = [
  {
    title: "Import IRS records",
    body: "Parsley reads state-level IRS Exempt Organizations CSV files and maps each row into a typed nonprofit record keyed by EIN.",
  },
  {
    title: "Attach reference dictionaries",
    body: "IRS codes are expanded through local dictionaries for NTEE, activity codes, deductibility, foundation type, filing requirements, affiliation, assets, organization type, and status.",
  },
  {
    title: "Filter and transform",
    body: "Eligible organizations become Convex-ready JSONL records with normalized names, addresses, financial buckets, NTEE major codes, and import metadata.",
  },
  {
    title: "Find public context",
    body: "The scraper looks for likely official websites, about pages, donation links, social links, and public text that helps describe what the organization actually does.",
  },
  {
    title: "Structure for discovery",
    body: "AI-assisted steps turn that public web content into consistent fields: mission, tagline, summary, activities, audience, geography, and keywords.",
  },
];

const CODE_EXPLANATIONS = [
  {
    term: "EIN",
    description:
      "The employer identification number. Cause Compass uses it as the stable public identifier for IRS-sourced organization records.",
  },
  {
    term: "NTEE code",
    description:
      "The National Taxonomy of Exempt Entities code. It describes the organization type at a more specific level, such as a particular education, health, arts, or human services category.",
  },
  {
    term: "NTEE major",
    description:
      "The first letter of the NTEE code, stored separately because it is useful for broad browsing and aggregate counts.",
  },
  {
    term: "Activity codes",
    description:
      "IRS activity codes describe activities reported in the EO file. A record can contain up to three.",
  },
  {
    term: "Deductibility code",
    description:
      "An IRS code describing whether contributions to the organization are deductible and under what conditions.",
  },
  {
    term: "Foundation code",
    description:
      "An IRS classification for foundation status, such as private foundation, operating foundation, or public charity.",
  },
  {
    term: "Asset and income buckets",
    description:
      "Broad IRS-derived financial ranges, stored instead of making exact financial size the focus of discovery.",
  },
  {
    term: "Enrichment stage",
    description:
      "An internal status for how much useful public profile information has been found and structured for an organization.",
  },
];

const SIZE_BUCKETS = [
  ["micro", "Under $50,000"],
  ["small", "$50,000 to $249,999"],
  ["mid", "$250,000 to $999,999"],
  ["large", "$1 million to $9,999,999"],
  ["mega", "$10 million or more"],
  ["unknown", "Missing or unavailable"],
] as const;

const SCALE_LABELS = [
  {
    label: "Grassroots",
    buckets: "micro, small",
    description: "Smaller organizations, by IRS asset bucket.",
  },
  {
    label: "Established",
    buckets: "mid",
    description: "Mid-sized organizations.",
  },
  {
    label: "Institutional",
    buckets: "large, mega",
    description: "Large and major organizations.",
  },
] as const;

const REACH_LEVELS = [
  {
    label: "Local",
    description: "Rooted in a city, neighborhood, county, or nearby community.",
  },
  {
    label: "Regional",
    description: "Spans a metro area, multi-county area, state, or region.",
  },
  {
    label: "National",
    description:
      "Operates across the United States or serves a national audience.",
  },
  {
    label: "Global",
    description: "Crosses national borders or focuses on international issues.",
  },
] as const;

const IRS_FIELDS = [
  "EIN",
  "Legal name",
  "Street, city, state, and ZIP",
  "In-care-of name",
  "NTEE code and NTEE major",
  "IRS activity codes",
  "Subsection, affiliation, classification, ruling, group exemption, status, organization, deductibility, and foundation codes",
  "Asset amount, income amount, and revenue amount before bucketing",
];

const DERIVED_FIELDS = [
  "Slug, generated from organization name plus EIN",
  "Asset bucket and income bucket, derived from IRS financial amounts",
  "Cause browse bucket, derived from NTEE major code",
  "Enrichment stage, derived from pipeline progress",
];

const AI_FIELDS = [
  "Likely official website URL",
  "Mission",
  "Tagline",
  "One-sentence summary",
  "Why support",
  "Target audience",
  "Geographic focus / reach",
  "Activities",
  "Keywords",
];

const SCRAPED_FIELDS = [
  "Donation links",
  "Social media links",
  "Logo links",
  "Email addresses",
  "About page links",
  "Newsletter signup signal",
  "Crawled text used as AI input",
];

const PROVENANCE_GROUPS = [
  { label: "Pulled from IRS data", items: IRS_FIELDS },
  { label: "Derived by Cause Compass", items: DERIVED_FIELDS },
  { label: "Found by scraping", items: SCRAPED_FIELDS },
  { label: "Generated or classified with AI", items: AI_FIELDS },
] as const;

const NTEE_MAJOR_CODES = [
  ["A", "Arts, Culture & Humanities"],
  ["B", "Education"],
  ["C", "Environment"],
  ["D", "Animal-Related"],
  ["E", "Health Care"],
  ["F", "Mental Health & Crisis Intervention"],
  ["G", "Voluntary Health Associations & Medical Disciplines"],
  ["H", "Medical Research"],
  ["I", "Crime & Legal-Related"],
  ["J", "Employment"],
  ["K", "Food, Agriculture & Nutrition"],
  ["L", "Housing & Shelter"],
  ["M", "Public Safety, Disaster Preparedness & Relief"],
  ["N", "Recreation & Sports"],
  ["O", "Youth Development"],
  ["P", "Human Services"],
  ["Q", "International, Foreign Affairs & National Security"],
  ["R", "Civil Rights, Social Action & Advocacy"],
  ["S", "Community Improvement & Capacity Building"],
  ["T", "Philanthropy, Voluntarism & Grantmaking Foundations"],
  ["U", "Science & Technology"],
  ["V", "Social Science"],
  ["W", "Public & Societal Benefit"],
  ["X", "Religion-Related"],
  ["Y", "Mutual & Membership Benefit"],
  ["Z", "Unknown"],
] as const;

const NTEE_MAJOR_LABELS = Object.fromEntries(NTEE_MAJOR_CODES) as Record<
  string,
  string
>;

const TAXONOMY_GROUPS = BROWSE_CATEGORIES.map((category) => ({
  slug: category.slug,
  label: category.label,
  majors: category.nteeMajors.map((major) => ({
    code: major,
    label: major ? NTEE_MAJOR_LABELS[major] : "No NTEE major code",
  })),
}));

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-[68ch] text-[15.5px] leading-[1.58] text-[var(--ink-soft)]">
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-heading text-[clamp(1.5rem,2.1vw,1.875rem)] leading-[1.15] font-semibold tracking-[-0.005em] text-[var(--ink)]">
      {children}
    </h2>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
    >
      {children}
    </a>
  );
}

function CodePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-w-8 justify-center rounded-full border border-[var(--rule)] bg-[var(--card)] px-2.5 py-1 text-[12px] leading-none font-semibold text-[var(--ink)]">
      {children}
    </span>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
      {children}
    </p>
  );
}

function MarkedList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-[14.5px] leading-[1.5] text-[var(--ink-soft)]"
        >
          <span
            aria-hidden
            className="mt-[0.72em] h-px w-4 shrink-0 bg-[var(--accent)]/70"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PageSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto mt-16 max-w-4xl md:mt-20 ${className}`}>
      {children}
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="container mx-auto px-6 py-16 md:py-20">
        <header className="mx-auto max-w-4xl">
          <h1 className="font-heading text-[clamp(2.4rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.01em] text-[var(--ink)]">
            How Cause Compass turns public records into discovery.
          </h1>
          <p className="mt-6 max-w-[68ch] text-[16px] leading-[1.58] text-[var(--ink-soft)]">
            Cause Compass reshapes public nonprofit data into something you can
            wander through. It does not rate, certify, or rank organizations. It
            exists to make it easier to see what a nonprofit is, where it works,
            and which causes it connects to. This page documents how that
            happens, and where it stops.
          </p>
        </header>

        <PageSection>
          <SectionHeading>Where the data comes from</SectionHeading>
          <div className="mt-5 space-y-4">
            <Paragraph>
              The base directory is IRS Exempt Organizations data. Parsley, the
              import package in this monorepo, processes those files and expands
              the codes inside them. A second layer adds public web information
              from organization sites, used only when the match is reasonably
              confident.
            </Paragraph>
            <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {IRS_LINKS.map((link) => (
                <li key={link.href} className="py-3">
                  <ExternalLink href={link.href}>{link.label}</ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </PageSection>

        <PageSection>
          <SectionHeading>How records become profiles</SectionHeading>
          <ol className="mt-8 border-t border-[var(--rule)]">
            {PIPELINE_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="grid gap-x-6 gap-y-1.5 border-b border-[var(--rule)] py-6 sm:grid-cols-[3.5rem_1fr]"
              >
                <span
                  aria-hidden
                  className="font-heading text-[26px] leading-none font-semibold text-[var(--rule-strong)] tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-heading text-[19px] leading-[1.2] font-semibold text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 max-w-[60ch] text-[14.5px] leading-[1.55] text-[var(--ink-soft)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </PageSection>

        <PageSection>
          <SectionHeading>Which fields come from where</SectionHeading>
          <div className="mt-5 space-y-6">
            <Paragraph>
              Each profile is assembled from four kinds of input. This is the
              split we track internally.
            </Paragraph>
            <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {PROVENANCE_GROUPS.map((group) => (
                <div key={group.label}>
                  <GroupLabel>{group.label}</GroupLabel>
                  <MarkedList items={group.items} />
                </div>
              ))}
            </div>
          </div>
        </PageSection>

        <PageSection>
          <SectionHeading>What the fields mean</SectionHeading>
          <dl className="mt-5 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {CODE_EXPLANATIONS.map((item) => (
              <div
                key={item.term}
                className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-8"
              >
                <dt className="font-heading text-[17px] font-semibold text-[var(--ink)]">
                  {item.term}
                </dt>
                <dd className="max-w-[62ch] text-[15px] leading-[1.55] text-[var(--ink-soft)]">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </PageSection>

        <PageSection>
          <SectionHeading>IRS codes and our cause buckets</SectionHeading>
          <div className="mt-5 space-y-5">
            <Paragraph>
              NTEE codes are hierarchical. We store both the specific code and
              its major, which is the first letter: a specific Education code
              rolls up to major <CodePill>B</CodePill>. We then group those IRS
              majors into broader cause areas that are easier to browse.
            </Paragraph>

            <dl className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {TAXONOMY_GROUPS.map((category) => (
                <div
                  key={category.slug}
                  className="grid gap-2 py-4 sm:grid-cols-[14rem_1fr] sm:gap-8"
                >
                  <dt className="font-heading text-[16px] leading-[1.25] font-semibold text-[var(--ink)]">
                    {category.label}
                  </dt>
                  <dd className="flex flex-col gap-1.5">
                    {category.majors.map((major) => (
                      <div
                        key={major.code ?? "none"}
                        className="flex items-baseline gap-2.5 text-[14px] leading-[1.4] text-[var(--ink-soft)]"
                      >
                        <CodePill>{major.code ?? "—"}</CodePill>
                        <span>{major.label}</span>
                      </div>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </PageSection>

        <PageSection>
          <SectionHeading>How we describe organization scale</SectionHeading>
          <div className="mt-5 space-y-8">
            <Paragraph>
              Exact finances are not the story here. Broad size language conveys
              rough scale without turning discovery into financial ranking, and
              geographic reach is inferred from public website content rather
              than declared.
            </Paragraph>

            <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
              <div>
                <GroupLabel>Size, from IRS financial amounts</GroupLabel>
                <p className="mt-3 max-w-[42ch] text-[14px] leading-[1.55] text-[var(--ink-soft)]">
                  Parsley converts IRS asset and income amounts into shared
                  buckets. The app primarily reads the asset bucket.
                </p>
                <dl className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {SIZE_BUCKETS.map(([bucket, range]) => (
                    <div
                      key={bucket}
                      className="grid grid-cols-[6rem_1fr] items-center gap-3 py-2.5"
                    >
                      <dt>
                        <CodePill>{bucket}</CodePill>
                      </dt>
                      <dd className="text-[14px] leading-[1.35] text-[var(--ink-soft)]">
                        {range}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <GroupLabel>Reach, inferred by AI</GroupLabel>
                <p className="mt-3 max-w-[42ch] text-[14px] leading-[1.55] text-[var(--ink-soft)]">
                  Geographic focus is read from public website content and
                  constrained to four labels.
                </p>
                <dl className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                  {REACH_LEVELS.map((level) => (
                    <div
                      key={level.label}
                      className="grid grid-cols-[6rem_1fr] items-baseline gap-3 py-2.5"
                    >
                      <dt>
                        <CodePill>{level.label}</CodePill>
                      </dt>
                      <dd className="text-[14px] leading-[1.4] text-[var(--ink-soft)]">
                        {level.description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div>
              <GroupLabel>How size appears in the product</GroupLabel>
              <dl className="mt-4 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                {SCALE_LABELS.map((scale) => (
                  <div
                    key={scale.label}
                    className="grid gap-1 py-3 sm:grid-cols-[9rem_8rem_1fr] sm:items-baseline sm:gap-6"
                  >
                    <dt className="font-heading text-[16px] font-semibold text-[var(--ink)]">
                      {scale.label}
                    </dt>
                    <dd className="text-[13px] text-[var(--ink-mute)]">
                      {scale.buckets}
                    </dd>
                    <dd className="text-[14px] leading-[1.4] text-[var(--ink-soft)]">
                      {scale.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </PageSection>

        <PageSection>
          <SectionHeading>What this methodology does not do</SectionHeading>
          <div className="mt-5 space-y-4">
            <Paragraph>
              Cause Compass does not verify every claim an organization makes,
              inspect financial filings for quality, or assign scores. Public
              records lag reality, organization websites move, and AI-assisted
              summaries can be incomplete or wrong.
            </Paragraph>
            <Paragraph>
              The product is built for discovery. Before donating, volunteering,
              or making any important decision, review the organization directly
              and consult the original public sources.
            </Paragraph>
          </div>
        </PageSection>
      </div>
    </main>
  );
}
