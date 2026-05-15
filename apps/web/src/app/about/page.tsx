import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About Cause Compass",
  description:
    "Cause Compass helps people discover nonprofits that match their values, not the ones with the strongest SEO.",
  alternates: {
    canonical: "/about",
  },
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
    question: "How does Cause Compass organize nonprofit data?",
    answer: (
      <>
        We start with public IRS Exempt Organizations data, attach code
        dictionaries, enrich records with public web information, and group NTEE
        major codes into broader cause areas. Read the full{" "}
        <Link
          href="/methodology"
          className="font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
        >
          methodology
        </Link>
        .
      </>
    ),
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
              Cause Compass was built to make nonprofit discovery simpler, more
              accessible, and more human. Whether you are looking for an
              organization to volunteer with or a nonprofit working on an issue
              you care deeply about, Cause Compass helps you explore
              organizations in one place.
            </p>
          </div>
        </header>

        {/* Why we built Cause Compass */}
        <section className="mx-auto mt-16 max-w-3xl md:mt-20">
          <SectionHeading>A discovery problem worth solving</SectionHeading>
          <div className="mt-4 space-y-3">
            <Paragraph>
              The nonprofit world is full of organizations doing important work,
              but many of them are surprisingly hard to find.
            </Paragraph>
            <Paragraph>
              Large organizations often have dedicated marketing teams, polished
              websites, and strong search visibility. Smaller nonprofits often
              do not. Yet those smaller organizations may be doing incredible
              work right in your neighborhood.
            </Paragraph>
            <Paragraph>
              Cause Compass exists to level that field: it surfaces nonprofits
              by mission and cause, not by who markets themselves best. Everyone
              should be able to find the organizations they care about, whether
              nationally known or quietly working down the street.
            </Paragraph>
          </div>
        </section>

        {/* What we are, and what we aren't */}
        <section className="mx-auto mt-16 max-w-3xl md:mt-20">
          <SectionHeading>What we are, and what we aren&rsquo;t</SectionHeading>
          <div className="mt-4 space-y-4">
            <Paragraph>
              Cause Compass organizes public nonprofit information into
              something you can wander through. We start with IRS records, add
              what organizations share publicly about their work, and use AI to
              shape that into profiles you can actually read. The{" "}
              <Link
                href="/methodology"
                className="font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
              >
                methodology
              </Link>{" "}
              covers where the data comes from and how far we take it.
            </Paragraph>
            <Paragraph>
              We are not a rating service, a giving platform, or a research
              tool. We do not score nonprofits, rank them, or decide which ones
              deserve your attention. Inclusion here is not an endorsement. It
              means an organization exists in the public record and we have
              tried to describe it clearly.
            </Paragraph>
            <Paragraph>
              Because we lean on public data and AI-assisted summaries, some
              details will be incomplete, outdated, or wrong. We keep working to
              improve that. If you notice something inaccurate, or you represent
              an organization and want to claim or update its profile, email{" "}
              <SupportLink />.
            </Paragraph>
          </div>
        </section>

        {/* Our vision */}
        <section className="mx-auto mt-16 max-w-3xl md:mt-20">
          <SectionHeading>A place for wandering</SectionHeading>
          <div className="mt-4 space-y-5">
            <Paragraph>
              Our vision is to make Cause Compass the easiest place to discover
              meaningful organizations, helping more people connect with causes
              they care about while helping nonprofits of all sizes become more
              discoverable.
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
