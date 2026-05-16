import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern your access to and use of Cause Compass.",
  alternates: {
    canonical: "/terms",
  },
};

const EFFECTIVE_DATE = "May 14, 2026";
const SUPPORT_EMAIL = "support@causecompass.com";

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] leading-[1.7] text-[var(--ink-soft)]">
      {children}
    </p>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-2 text-[15px] leading-[1.7] text-[var(--ink-soft)] marker:text-[var(--ink-mute)]">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Subheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[15px] font-semibold text-[var(--ink)]">{children}</h3>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-heading text-[1.35rem] font-semibold text-[var(--ink)]">
        <span className="mr-2 text-[var(--ink-mute)] tabular-nums">
          {number}.
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function SupportLink() {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
    >
      {SUPPORT_EMAIL}
    </a>
  );
}

export default function TermsPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="container mx-auto max-w-3xl px-6 py-16 md:py-20">
        <header>
          <h1 className="font-heading text-[2rem] leading-[1.1] font-semibold tracking-[-0.01em] text-[var(--ink)] md:text-[2.5rem]">
            Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-[13px] text-[var(--ink-mute)]">
            Effective {EFFECTIVE_DATE}
          </p>
          <div className="mt-6 space-y-4">
            <Paragraph>
              These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your
              access to and use of Cause Compass, including the website,
              services, and features we provide (collectively, the
              &ldquo;Service&rdquo;).
            </Paragraph>
            <Paragraph>
              By accessing or using Cause Compass, you agree to these Terms. If
              you do not agree, please do not use the Service.
            </Paragraph>
          </div>
        </header>

        <Section number={1} title="About Cause Compass">
          <Paragraph>
            Cause Compass is an independently operated platform designed to help
            people discover nonprofit organizations and explore publicly
            available information about them.
          </Paragraph>
          <Paragraph>
            Questions about these Terms can be sent to <SupportLink />.
          </Paragraph>
        </Section>

        <Section number={2} title="Eligibility">
          <Paragraph>
            You must be at least 13 years old to use Cause Compass, or the
            minimum age required by law where you live.
          </Paragraph>
          <Paragraph>
            If you create an account, you agree to provide accurate information
            and keep it current.
          </Paragraph>
        </Section>

        <Section number={3} title="Your right to use the Service">
          <Paragraph>
            Subject to these Terms, you are granted a limited, non-exclusive,
            non-transferable, revocable license to use Cause Compass for
            personal, non-commercial use.
          </Paragraph>
          <Subheading>You may use the Service to:</Subheading>
          <List
            items={[
              "Discover nonprofit organizations",
              "Browse organization profiles",
              "Save organizations for later",
              "Share public links",
            ]}
          />
          <Paragraph>
            This license does not transfer ownership of the Service or its
            content.
          </Paragraph>
        </Section>

        <Section number={4} title="Prohibited use">
          <Paragraph>You agree not to:</Paragraph>
          <List
            items={[
              "Use the Service for unlawful purposes",
              "Violate intellectual property or other legal rights",
              "Attempt unauthorized access to accounts, systems, or infrastructure",
              "Interfere with the operation, security, or availability of the Service",
              "Use bots, scrapers, crawlers, or automated means to collect data from the Service in ways that burden, disrupt, or replicate the Service without permission",
              "Reverse engineer or attempt to extract source code or underlying systems except where legally permitted",
              "Submit false, misleading, fraudulent, or impersonating information",
              "Harass, abuse, threaten, or harm others",
              "Republish, resell, or redistribute substantial portions of Service content without permission",
            ]}
          />
        </Section>

        <Section number={5} title="Accounts">
          <Paragraph>If you create an account:</Paragraph>
          <List
            items={[
              "You are responsible for maintaining your login credentials",
              "You are responsible for activity under your account",
              "You must notify us if you suspect unauthorized access",
            ]}
          />
          <Paragraph>
            Access may be suspended or terminated if these Terms are violated or
            if use creates security, legal, or operational risk.
          </Paragraph>
        </Section>

        <Section
          number={6}
          title="Nonprofit information and AI-assisted content"
        >
          <Paragraph>Cause Compass is a discovery platform.</Paragraph>
          <Paragraph>
            The Service aggregates publicly available nonprofit information and
            may use automated systems, including AI-assisted tools, to help:
          </Paragraph>
          <List
            items={[
              "Associate organizations with likely official public websites",
              "Organize information into structured profiles",
              "Generate summaries, categories, or metadata",
              "Improve discoverability",
            ]}
          />
          <Paragraph>
            Because public data changes and automated systems can make mistakes:
          </Paragraph>
          <List
            items={[
              "Information may be incomplete, outdated, inaccurate, or inconsistent",
              "AI-generated content may contain errors",
              "Profile details may not reflect the most current information",
            ]}
          />
          <Paragraph>
            Cause Compass is provided for informational discovery purposes only.
          </Paragraph>
          <Paragraph>
            You should independently verify important details directly with
            organizations before making donations, volunteer commitments,
            partnerships, or other significant decisions.
          </Paragraph>
          <Paragraph>
            Inclusion in Cause Compass does not constitute endorsement,
            certification, evaluation, ranking, or recommendation.
          </Paragraph>
        </Section>

        <Section
          number={7}
          title="Corrections, submissions, and organization claims"
        >
          <Paragraph>
            If you submit feedback, corrections, organization updates, nonprofit
            suggestions, or profile claim requests, you represent that the
            information provided is accurate to the best of your knowledge.
          </Paragraph>
          <Paragraph>
            By submitting information, you grant Cause Compass permission to
            use, modify, store, and incorporate that information as needed to
            operate and improve the Service.
          </Paragraph>
        </Section>

        <Section number={8} title="Third-party links">
          <Paragraph>
            Cause Compass may link to third-party nonprofit websites or external
            resources.
          </Paragraph>
          <Paragraph>
            These are not controlled by Cause Compass, and we are not
            responsible for:
          </Paragraph>
          <List
            items={[
              "Their content",
              "Accuracy",
              "Availability",
              "Security",
              "Privacy practices",
              "Services or offerings",
            ]}
          />
          <Paragraph>
            Interactions with third parties are solely between you and them.
          </Paragraph>
        </Section>

        <Section number={9} title="Intellectual property">
          <Paragraph>
            Cause Compass, including its software, design, branding, features,
            text, graphics, and underlying systems, is protected by intellectual
            property law.
          </Paragraph>
          <Paragraph>
            These Terms do not grant ownership rights in the Service.
          </Paragraph>
        </Section>

        <Section number={10} title="Privacy">
          <Paragraph>
            Your use of Cause Compass is also governed by the Privacy Policy.
          </Paragraph>
        </Section>

        <Section number={11} title="Service availability">
          <Paragraph>
            The Service may be modified, suspended, restricted, or discontinued
            at any time, with or without notice.
          </Paragraph>
          <Paragraph>
            We do not guarantee uninterrupted availability or error-free
            operation.
          </Paragraph>
        </Section>

        <Section number={12} title="Disclaimer of warranties">
          <Paragraph>
            CAUSE COMPASS IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
            AVAILABLE.&rdquo;
          </Paragraph>
          <Paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALL WARRANTIES ARE
            DISCLAIMED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, AND
            AVAILABILITY.
          </Paragraph>
          <Paragraph>WE DO NOT GUARANTEE:</Paragraph>
          <List
            items={[
              "Continuous availability",
              "Complete or accurate information",
              "Error-free operation",
              "Freedom from security vulnerabilities",
            ]}
          />
        </Section>

        <Section number={13} title="Limitation of liability">
          <Paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAUSE COMPASS, ITS OPERATOR,
            AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES.
          </Paragraph>
          <Paragraph>
            THIS INCLUDES LOSS OF DATA, LOST OPPORTUNITIES, FINANCIAL LOSS,
            BUSINESS INTERRUPTION, OR OTHER DAMAGES ARISING FROM USE OF OR
            INABILITY TO USE THE SERVICE.
          </Paragraph>
          <Paragraph>
            TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE WILL NOT
            EXCEED $100 USD.
          </Paragraph>
        </Section>

        <Section number={14} title="Indemnification">
          <Paragraph>
            You agree to indemnify and hold harmless Cause Compass, its
            operator, and service providers from claims, damages, liabilities,
            and expenses arising from:
          </Paragraph>
          <List
            items={[
              "Your misuse of the Service",
              "Violation of these Terms",
              "Violation of another person's rights",
              "Information you submit",
            ]}
          />
        </Section>

        <Section number={15} title="Termination">
          <Paragraph>
            Access may be suspended or terminated at any time if:
          </Paragraph>
          <List
            items={[
              "These Terms are violated",
              "Use creates risk",
              "The Service is discontinued",
            ]}
          />
          <Paragraph>
            Provisions that reasonably should survive termination will remain in
            effect.
          </Paragraph>
        </Section>

        <Section number={16} title="Changes to these Terms">
          <Paragraph>These Terms may be updated periodically.</Paragraph>
          <Paragraph>
            The effective date at the top reflects the latest revision.
          </Paragraph>
          <Paragraph>
            Continued use of the Service after updates means you accept the
            revised Terms.
          </Paragraph>
        </Section>

        <Section number={17} title="Governing law">
          <Paragraph>
            These Terms are governed by the laws of the State of California,
            without regard to conflict of law principles.
          </Paragraph>
          <Paragraph>
            Legal disputes relating to the Service will be resolved in the
            courts located in California.
          </Paragraph>
        </Section>

        <Section number={18} title="Entire agreement">
          <Paragraph>
            These Terms, together with the Privacy Policy, constitute the entire
            agreement regarding your use of the Service.
          </Paragraph>
          <Paragraph>
            If any provision is unenforceable, the remaining provisions remain
            effective.
          </Paragraph>
        </Section>

        <Section number={19} title="Contact">
          <Paragraph>Questions, corrections, or legal concerns:</Paragraph>
          <Paragraph>
            <SupportLink />
          </Paragraph>
        </Section>
      </div>
    </main>
  );
}
