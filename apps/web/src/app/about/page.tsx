import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About Cause Compass",
  description:
    "Cause Compass helps people discover nonprofits that match their values, not the ones with the strongest SEO.",
};

const SUPPORT_EMAIL = "support@causecompass.com";

function SupportLink({ children }: { children?: ReactNode }) {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
    >
      {children ?? SUPPORT_EMAIL}
    </a>
  );
}

const FAQS: { question: string; answer: ReactNode }[] = [
  {
    question: "Is Cause Compass free to use?",
    answer:
      "Yes. Cause Compass is free to use for individuals exploring nonprofits and causes.",
  },
  {
    question: "Can I save nonprofits I want to revisit?",
    answer:
      "Yes. You can save organizations you're interested in so you can come back to them later.",
  },
  {
    question: "Does Cause Compass recommend or rank nonprofits?",
    answer:
      "No. Cause Compass is a discovery platform designed to help people explore organizations, not a nonprofit rating or endorsement service.",
  },
  {
    question:
      "I found inaccurate information about a nonprofit. What should I do?",
    answer: (
      <>
        We want Cause Compass to be as accurate as possible. If you notice
        incorrect or outdated information, please contact us at <SupportLink />.
      </>
    ),
  },
  {
    question: "I represent a nonprofit. Can I claim or update our profile?",
    answer: (
      <>
        Yes. If you represent an organization listed on Cause Compass and would
        like to update information or claim your profile, reach out to us at{" "}
        <SupportLink />.
      </>
    ),
  },
  {
    question: "Can I suggest a nonprofit to be added?",
    answer:
      "Yes. We're always working to expand coverage and welcome suggestions for organizations that should be included.",
  },
  {
    question: "How can I support an organization I discover?",
    answer:
      "Each nonprofit profile links to the organization's public presence so you can learn more about donating, volunteering, attending events, or otherwise getting involved.",
  },
  {
    question: "Do you share my personal information with nonprofits?",
    answer:
      "No. Browsing or saving organizations on Cause Compass does not result in your personal information being shared with those organizations.",
  },
  {
    question: "Is Cause Compass only for large national nonprofits?",
    answer:
      "Not at all. Cause Compass is designed to help people discover organizations of all sizes, including smaller and local nonprofits that may be harder to find through traditional search.",
  },
  {
    question: "Can nonprofits pay to be featured?",
    answer:
      "No. Organizations cannot pay to be featured or endorsed on Cause Compass.",
  },
];

const SOURCES = [
  "Public nonprofit registration and filing information",
  "Organizational websites and public web content",
  "Public reference data",
  "AI-assisted categorization, summarization, and profile structuring",
];

const AI_HELPS = [
  "Match nonprofits with their likely official public websites",
  "Organize information into consistent profile formats",
  "Generate summaries and structured metadata that improve discovery",
  "Improve searchability across causes, missions, and organizations",
];

const CAVEATS = [
  "Some information may be incomplete, outdated, or incorrect",
  "AI-generated summaries or classifications may occasionally contain mistakes",
  "Inclusion on Cause Compass does not imply endorsement, certification, or evaluation",
];

function MarkedList({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-[15px] leading-[1.55] text-[var(--ink-soft)]"
        >
          <span
            aria-hidden
            className="mt-[0.7em] block h-px w-4 shrink-0 bg-[var(--accent)]/70"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15.5px] leading-[1.55] text-[var(--ink-soft)]">
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

export default function AboutPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="container mx-auto px-6 py-16 md:py-20">
        {/* Hero */}
        <header className="mx-auto max-w-3xl">
          <h1 className="font-heading text-[clamp(2.4rem,5vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.01em] text-[var(--ink)]">
            Helping people discover causes that matter.
          </h1>
          <div className="mt-6 max-w-[62ch] space-y-3 text-[16px] leading-[1.55] text-[var(--ink-soft)]">
            <p>
              Finding a nonprofit you care about should be easier. Today,
              discovering organizations often means digging through fragmented
              directories, outdated records, and search results that favor
              whoever has the strongest SEO, not necessarily the organizations
              doing meaningful work in your own community.
            </p>
            <p>
              Cause Compass was built to make nonprofit discovery simpler,
              more accessible, and more human. Whether you are looking for a
              cause to support, an organization to volunteer with, or a
              nonprofit working on an issue you care deeply about, Cause
              Compass helps you explore organizations in one place.
            </p>
          </div>
        </header>

        {/* Why we built Cause Compass */}
        <section className="mx-auto mt-16 max-w-3xl md:mt-20">
          <SectionHeading>A discovery problem worth solving</SectionHeading>
          <div className="mt-4 space-y-3">
            <Paragraph>
              The nonprofit world is full of organizations doing important
              work, but many of them are surprisingly hard to find.
            </Paragraph>
            <Paragraph>
              Large organizations often have dedicated marketing teams,
              polished websites, and strong search visibility. Smaller
              nonprofits often do not. Yet those smaller organizations may be
              doing incredible work right in your neighborhood.
            </Paragraph>
            <Paragraph>
              Cause Compass was created to help level that playing field by
              making it easier for people to discover nonprofits based on
              mission and cause, not just search visibility. We believe people
              should be able to discover organizations they care about,
              whether they are nationally known or quietly making a difference
              locally.
            </Paragraph>
          </div>
        </section>

        {/* How Cause Compass works */}
        <section className="mx-auto mt-16 max-w-3xl md:mt-20">
          <SectionHeading>Public data, organized for discovery</SectionHeading>
          <div className="mt-4 space-y-6">
            <Paragraph>
              Cause Compass brings together publicly available nonprofit
              information and uses AI to help make organization profiles
              easier to explore.
            </Paragraph>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
                What we draw on
              </p>
              <MarkedList items={SOURCES} />
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-[0.32em] text-[var(--ink-mute)] uppercase">
                Where AI helps
              </p>
              <MarkedList items={AI_HELPS} />
            </div>
          </div>
        </section>

        {/* Accuracy and methodology */}
        <section className="mx-auto mt-16 max-w-3xl md:mt-20">
          <SectionHeading>What we are, and what we aren&rsquo;t</SectionHeading>
          <div className="mt-4 space-y-4">
            <Paragraph>
              Cause Compass is built to improve discovery, not to act as a
              nonprofit rating or endorsement platform. Because we rely on
              public data sources and AI-assisted systems, the directory has
              real limits.
            </Paragraph>

            <MarkedList items={CAVEATS} />

            <Paragraph>
              We continuously work to improve data quality and expand
              coverage. If you notice inaccurate information, inconsistencies,
              or if you represent a nonprofit and would like to claim or
              update your organization&rsquo;s profile, please email{" "}
              <SupportLink />.
            </Paragraph>
          </div>
        </section>

        {/* Our vision */}
        <section className="mx-auto mt-16 max-w-3xl md:mt-20">
          <SectionHeading>A place for wandering</SectionHeading>
          <div className="mt-4 space-y-5">
            <Paragraph>
              Our vision is to make Cause Compass the easiest place to
              discover meaningful organizations, helping more people connect
              with causes they care about while helping nonprofits of all
              sizes become more discoverable.
            </Paragraph>
            <blockquote className="border-l-2 border-[var(--accent)] pl-6">
              <p className="font-heading text-[clamp(1.375rem,2.2vw,1.75rem)] leading-[1.25] font-medium tracking-[-0.005em] text-[var(--ink)] italic">
                You should be able to find organizations working on causes you
                care about as easily as you discover restaurants, books, or
                local events.
              </p>
            </blockquote>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-24 grid max-w-6xl gap-12 md:mt-28 lg:grid-cols-[1fr_2fr] lg:gap-20">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-heading text-[clamp(2.4rem,4vw,3.5rem)] leading-[0.98] font-semibold tracking-[-0.01em] text-[var(--ink)]">
              FAQ
            </h2>
            <p className="mt-4 max-w-[36ch] text-[15px] leading-[1.55] text-[var(--ink-soft)]">
              Quick answers to questions about how Cause Compass works. Still
              looking? We read every note.
            </p>
            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-[11px] font-semibold tracking-[0.32em] text-[var(--paper)] uppercase transition-all hover:bg-[var(--accent)] hover:shadow-[0_18px_40px_-20px_rgba(200,38,110,0.55)]"
            >
              Contact us
            </Link>
          </aside>

          <dl className="divide-y divide-[var(--rule)]">
            {FAQS.map((faq) => (
              <div key={faq.question} className="py-5 first:pt-0 last:pb-0">
                <dt className="font-heading text-[17px] leading-[1.3] font-semibold text-[var(--ink)]">
                  {faq.question}
                </dt>
                <dd className="mt-2 max-w-[68ch] text-[15px] leading-[1.55] text-[var(--ink-soft)]">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
