import Link from "next/link";
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
    body: "Eligible organizations are transformed into Convex-ready JSONL records with normalized names, addresses, financial buckets, NTEE major codes, and import metadata.",
  },
  {
    title: "Find public context",
    body: "The scraper and confirmation pipeline look for likely official websites, about pages, donation links, social links, and public text that can help describe what the organization actually does.",
  },
  {
    title: "Structure for discovery",
    body: "AI-assisted steps help turn public web content into consistent fields such as mission, tagline, summary, activities, audience, geography, and keywords. Those fields improve browsing, but they are not treated as guarantees.",
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
      "The first letter of the NTEE code. Cause Compass stores this separately because it is useful for broad browsing and aggregate counts.",
  },
  {
    term: "Activity codes",
    description:
      "IRS activity codes describe activities reported in the EO file. A record can contain up to three activity codes.",
  },
  {
    term: "Deductibility code",
    description:
      "An IRS code describing whether contributions to the organization are deductible and under what conditions.",
  },
  {
    term: "Foundation code",
    description:
      "An IRS classification for foundation status, such as private foundation, operating foundation, or public charity style categories.",
  },
  {
    term: "Asset and income buckets",
    description:
      "Cause Compass stores broad IRS-derived financial buckets instead of making exact financial size the focus of discovery.",
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
    buckets: ["micro", "small"],
    description:
      "Used in the app for smaller organizations based on IRS asset bucket.",
  },
  {
    label: "Established",
    buckets: ["mid"],
    description: "Used for mid-sized organizations.",
  },
  {
    label: "Institutional",
    buckets: ["large", "mega"],
    description: "Used for large and major organizations.",
  },
] as const;

const REACH_LEVELS = [
  {
    label: "Local",
    description:
      "Work appears rooted in a city, neighborhood, county, or nearby community.",
  },
  {
    label: "Regional",
    description:
      "Work appears to span a metro area, multi-county area, state, or region.",
  },
  {
    label: "National",
    description:
      "Work appears to operate across the United States or serve a national audience.",
  },
  {
    label: "Global",
    description:
      "Work appears to cross national borders or focus on international issues.",
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
  ...category,
  majors: category.nteeMajors.map((major) => ({
    code: major,
    label: major ? NTEE_MAJOR_LABELS[major] : "No NTEE major code",
  })),
}));

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15.5px] leading-[1.58] text-[var(--ink-soft)]">
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
        <span aria-hidden className="h-px w-7 bg-[var(--accent)]" />
        {eyebrow}
      </p>
      <h2 className="mt-3 font-heading text-[clamp(1.65rem,2.5vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.005em] text-[var(--ink)]">
        {children}
      </h2>
    </div>
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
    <span className="inline-flex min-w-9 justify-center rounded-full border border-[var(--rule)] bg-[var(--card)] px-3 py-1 text-[12px] leading-none font-semibold text-[var(--ink)]">
      {children}
    </span>
  );
}

function CompactList({ items }: { items: readonly string[] }) {
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
          <p className="text-[11px] font-semibold tracking-[0.32em] text-[var(--accent)] uppercase">
            Methodology
          </p>
          <h1 className="mt-4 font-heading text-[clamp(2.4rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.01em] text-[var(--ink)]">
            How Cause Compass turns public records into discovery.
          </h1>
          <div className="mt-6 max-w-[68ch] space-y-3">
            <Paragraph>
              Cause Compass starts with public nonprofit data and reshapes it
              for casual exploration. The goal is not to rate, certify, or rank
              organizations. The goal is to make it easier to understand what a
              nonprofit is, where it works, and which causes it may connect to.
            </Paragraph>
            <Paragraph>
              This page explains the records, codes, scraping, source links,
              and higher-level groupings behind the product.
            </Paragraph>
          </div>
        </header>

        <PageSection>
          <SectionHeading eyebrow="Sources">Where the data comes from</SectionHeading>
          <div className="mt-5 space-y-4">
            <Paragraph>
              The base directory comes from IRS Exempt Organizations data.
              Parsley, the import package in this monorepo, processes those
              files and uses reference dictionaries for the codes that appear in
              them. The public profile layer adds information from organization
              websites and other public web pages when those pages can be
              matched with reasonable confidence.
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
          <SectionHeading eyebrow="Pipeline">How records become profiles</SectionHeading>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {PIPELINE_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5"
              >
                <p className="text-[11px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-[1.55] text-[var(--ink-soft)]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </PageSection>

        <PageSection>
          <SectionHeading eyebrow="Codes">What the fields mean</SectionHeading>
          <dl className="mt-5 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {CODE_EXPLANATIONS.map((item) => (
              <div
                key={item.term}
                className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-8"
              >
                <dt className="font-heading text-[17px] font-semibold text-[var(--ink)]">
                  {item.term}
                </dt>
                <dd className="text-[15px] leading-[1.55] text-[var(--ink-soft)]">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </PageSection>

        <PageSection>
          <SectionHeading eyebrow="Field provenance">
            Which fields come from which source
          </SectionHeading>
          <div className="mt-5 space-y-4">
            <Paragraph>
              Organization profiles combine source data, deterministic
              transformations, scraped public web information, and AI-assisted
              enrichment. This is the split we use internally.
            </Paragraph>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5">
                <h3 className="font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                  Pulled from IRS data
                </h3>
                <CompactList items={IRS_FIELDS} />
              </div>

              <div className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5">
                <h3 className="font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                  Derived by Cause Compass
                </h3>
                <CompactList items={DERIVED_FIELDS} />
              </div>

              <div className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5">
                <h3 className="font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                  Found by scraping
                </h3>
                <CompactList items={SCRAPED_FIELDS} />
              </div>

              <div className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5">
                <h3 className="font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                  Generated or classified with AI
                </h3>
                <CompactList items={AI_FIELDS} />
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection>
          <SectionHeading eyebrow="Size and reach">
            How we describe organization scale
          </SectionHeading>
          <div className="mt-5 space-y-6">
            <Paragraph>
              Cause Compass avoids presenting exact finances as the main story.
              We use broad size language so a person can understand rough scale
              without turning discovery into financial ranking.
            </Paragraph>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5">
                <h3 className="font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                  Size comes from IRS financial amounts
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.55] text-[var(--ink-soft)]">
                  Parsley converts IRS asset and income amounts into shared
                  buckets. The app primarily uses the asset bucket when it calls
                  an organization grassroots, established, large, or major.
                </p>
                <div className="mt-4 grid gap-2">
                  {SIZE_BUCKETS.map(([bucket, range]) => (
                    <div
                      key={bucket}
                      className="grid grid-cols-[5.5rem_1fr] items-center gap-3 rounded-[14px] border border-[var(--rule)] bg-[var(--card)] px-3 py-2.5"
                    >
                      <CodePill>{bucket}</CodePill>
                      <span className="text-[14px] leading-[1.35] text-[var(--ink-soft)]">
                        {range}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5">
                <h3 className="font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                  Reach is AI-assisted
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.55] text-[var(--ink-soft)]">
                  Geographic focus is inferred from public website content and
                  constrained to four labels. It is a discovery aid, not a legal
                  service-area claim.
                </p>
                <div className="mt-4 grid gap-2">
                  {REACH_LEVELS.map((level) => (
                    <div
                      key={level.label}
                      className="rounded-[14px] border border-[var(--rule)] bg-[var(--card)] px-3 py-3"
                    >
                      <CodePill>{level.label}</CodePill>
                      <p className="mt-2 text-[14px] leading-[1.4] text-[var(--ink-soft)]">
                        {level.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--rule)] bg-[color:rgba(255,255,255,0.58)] p-5">
              <h3 className="font-heading text-[20px] leading-[1.15] font-semibold text-[var(--ink)]">
                How size appears in the product
              </h3>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {SCALE_LABELS.map((scale) => (
                  <div
                    key={scale.label}
                    className="rounded-[14px] border border-[var(--rule)] bg-[var(--card)] px-3 py-3"
                  >
                    <h4 className="font-heading text-[16px] font-semibold text-[var(--ink)]">
                      {scale.label}
                    </h4>
                    <p className="mt-1 text-[13.5px] leading-[1.4] text-[var(--ink-soft)]">
                      Buckets: {scale.buckets.join(", ")}
                    </p>
                    <p className="mt-2 text-[13.5px] leading-[1.4] text-[var(--ink-soft)]">
                      {scale.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection>
          <SectionHeading eyebrow="NTEE">IRS codes and our cause buckets</SectionHeading>
          <div className="mt-5 space-y-4">
            <Paragraph>
              NTEE codes are hierarchical. Cause Compass stores both the
              specific code and the major code, which is the first letter. For
              example, a specific code under Education rolls up to major code{" "}
              <CodePill>B</CodePill>. We then group those IRS major codes into
              broader cause areas that are easier to browse.
            </Paragraph>

            <div className="grid gap-4">
              {TAXONOMY_GROUPS.map((category) => (
                <div
                  key={category.slug}
                  className="rounded-[20px] border bg-[color:rgba(255,255,255,0.58)] p-4 sm:grid sm:grid-cols-[15rem_1fr] sm:gap-5 sm:p-5"
                  style={{
                    borderColor: category.accent,
                    backgroundColor: `${category.accent}14`,
                  }}
                >
                  <div>
                    <h3 className="font-heading text-[18px] leading-[1.15] font-semibold text-[var(--ink)]">
                      {category.label}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-[1.45] text-[var(--ink-soft)]">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:mt-0">
                    {category.majors.map((major) => (
                      <div
                        key={major.code ?? "none"}
                        className="grid gap-2 rounded-[14px] border border-[var(--rule)] bg-[var(--card)] px-3 py-3 sm:grid-cols-[5rem_1fr] sm:items-center"
                      >
                        <CodePill>{major.code ?? "None"}</CodePill>
                        <span className="text-[14px] leading-[1.35] text-[var(--ink-soft)]">
                          {major.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageSection>

        <PageSection>
          <SectionHeading eyebrow="Limits">What this methodology does not do</SectionHeading>
          <div className="mt-5 space-y-4">
            <Paragraph>
              Cause Compass does not verify every claim an organization makes,
              inspect financial filings for quality, or assign scores. Public
              records can lag reality, organization websites can move, and
              AI-assisted summaries can be incomplete or wrong.
            </Paragraph>
            <Paragraph>
              The product is built for discovery. Before donating, volunteering,
              or making any important decision, users should review the
              organization directly and consult the original public sources.
            </Paragraph>
            <Link
              href="/about"
              className="inline-flex items-center rounded-full bg-[var(--ink)] px-6 py-3 text-[11px] font-semibold tracking-[0.32em] text-[var(--paper)] uppercase transition-all hover:bg-[var(--accent)] hover:shadow-[0_18px_40px_-20px_rgba(200,38,110,0.55)]"
            >
              Back to about
            </Link>
          </div>
        </PageSection>
      </div>
    </main>
  );
}
