import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Cause Compass collects, how we use it, and the rights you have over your information.",
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

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="container mx-auto max-w-3xl px-6 py-16 md:py-20">
        <header>
          <h1 className="font-heading text-[2rem] leading-[1.1] font-semibold tracking-[-0.01em] text-[var(--ink)] md:text-[2.5rem]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-[13px] text-[var(--ink-mute)]">
            Effective {EFFECTIVE_DATE}
          </p>
          <div className="mt-6 space-y-4">
            <Paragraph>Cause Compass respects your privacy.</Paragraph>
            <Paragraph>
              This Privacy Policy explains what information is collected when
              you use Cause Compass, how that information is used, when it may
              be shared, and the choices you have regarding your information.
            </Paragraph>
            <Paragraph>
              If you do not agree with this Privacy Policy, please do not use
              the Service.
            </Paragraph>
            <Paragraph>
              Questions can be sent to <SupportLink />.
            </Paragraph>
          </div>
        </header>

        <Section number={1} title="Information we collect">
          <Paragraph>
            We collect a limited amount of information necessary to operate and
            improve Cause Compass.
          </Paragraph>
          <Subheading>Information you provide directly</Subheading>
          <List
            items={[
              "Your name, if you choose to provide it",
              "Your email address",
              "Authentication and account-related information",
              "Nonprofits or organizations you save",
              "Messages you send through support or feedback channels",
              "Information submitted through correction requests, nonprofit claim requests, or feedback",
            ]}
          />
          <Subheading>Information collected automatically</Subheading>
          <Paragraph>
            When you use Cause Compass, some technical information is collected
            automatically. This may include:
          </Paragraph>
          <List
            items={[
              "Browser type",
              "Device type",
              "Operating system",
              "IP address",
              "General geographic location derived from IP address",
              "Pages visited",
              "Features used",
              "Referral source",
              "Interaction timestamps",
              "Cookie or session identifiers",
              "Error and diagnostic information",
            ]}
          />
          <Paragraph>
            This helps operate the Service, improve reliability, investigate
            bugs, and improve the overall user experience.
          </Paragraph>
        </Section>

        <Section
          number={2}
          title="Authentication and infrastructure providers"
        >
          <Paragraph>
            Cause Compass relies on third-party infrastructure providers to
            operate core parts of the Service. This includes:
          </Paragraph>
          <List
            items={[
              <>
                <strong className="font-semibold text-[var(--ink)]">
                  Better Auth
                </strong>{" "}
                for authentication and account management
              </>,
              <>
                <strong className="font-semibold text-[var(--ink)]">
                  Convex
                </strong>{" "}
                for backend infrastructure and application data storage
              </>,
            ]}
          />
          <Paragraph>
            These providers may process information necessary to provide their
            services.
          </Paragraph>
        </Section>

        <Section number={3} title="Analytics">
          <Paragraph>
            Cause Compass uses{" "}
            <strong className="font-semibold text-[var(--ink)]">PostHog</strong>{" "}
            for product analytics. This helps us understand how the product is
            being used so we can improve usability, identify product issues,
            and make the experience better over time.
          </Paragraph>
          <Paragraph>Analytics information may include:</Paragraph>
          <List
            items={[
              "Page visits",
              "Clicks",
              "Navigation patterns",
              "Product interaction events",
              "Browser and device metadata",
              "Error events",
              "Session-level usage information",
            ]}
          />
          <Paragraph>
            Cause Compass does{" "}
            <strong className="font-semibold text-[var(--ink)]">not</strong>{" "}
            currently use session replay tools to record visual reproductions
            of user browsing sessions.
          </Paragraph>
          <Paragraph>
            Analytics systems may associate usage activity with account or
            session identifiers used by the Service.
          </Paragraph>
        </Section>

        <Section number={4} title="How we use information">
          <Paragraph>We use information to:</Paragraph>
          <List
            items={[
              "Operate and maintain Cause Compass",
              "Create and manage accounts",
              "Authenticate users",
              "Preserve saved organizations",
              "Improve nonprofit discovery functionality",
              "Analyze product performance and usage",
              "Diagnose bugs, technical problems, abuse, or security issues",
              "Respond to support requests",
              "Process correction requests and nonprofit claims",
              "Comply with legal obligations",
              "Protect the security and operation of the Service",
            ]}
          />
          <Paragraph>
            Cause Compass does{" "}
            <strong className="font-semibold text-[var(--ink)]">not</strong>{" "}
            sell your personal information.
          </Paragraph>
          <Paragraph>
            Cause Compass does{" "}
            <strong className="font-semibold text-[var(--ink)]">not</strong>{" "}
            share your saved organizations or browsing activity with nonprofits
            simply because you use the platform.
          </Paragraph>
          <Paragraph>
            Cause Compass does{" "}
            <strong className="font-semibold text-[var(--ink)]">not</strong>{" "}
            send marketing emails.
          </Paragraph>
        </Section>

        <Section number={5} title="Cookies and similar technologies">
          <Paragraph>
            Cause Compass uses cookies and similar technologies to:
          </Paragraph>
          <List
            items={[
              "Keep users signed in",
              "Maintain authenticated sessions",
              "Remember product preferences",
              "Support analytics",
              "Improve reliability and functionality",
            ]}
          />
          <Paragraph>
            You can control cookies through your browser settings.
          </Paragraph>
          <Paragraph>
            Disabling cookies may impact parts of the Service.
          </Paragraph>
        </Section>

        <Section number={6} title="Sharing information">
          <Paragraph>
            Information may be shared with service providers that help operate
            Cause Compass. Examples include providers supporting:
          </Paragraph>
          <List
            items={[
              "Authentication",
              "Hosting and infrastructure",
              "Analytics",
              "Security monitoring",
              "Error monitoring",
              "Customer support workflows",
            ]}
          />
          <Paragraph>Information may also be disclosed:</Paragraph>
          <List
            items={[
              "When legally required",
              "To comply with lawful requests",
              "To enforce Terms & Conditions",
              "To protect users, public safety, or the Service",
              "In connection with a transfer or restructuring of the Service",
            ]}
          />
          <Paragraph>
            Aggregated or de-identified information may be shared where it does
            not reasonably identify individuals.
          </Paragraph>
        </Section>

        <Section number={7} title="Data retention">
          <Paragraph>
            Information is retained only as long as reasonably necessary for
            legitimate operational purposes, including:
          </Paragraph>
          <List
            items={[
              "Maintaining accounts",
              "Preserving saved preferences",
              "Supporting security investigations",
              "Resolving disputes",
              "Meeting legal or operational obligations",
            ]}
          />
          <Paragraph>
            If you request account deletion, we will make reasonable efforts to
            delete or anonymize applicable personal information, subject to
            legitimate retention requirements.
          </Paragraph>
        </Section>

        <Section number={8} title="Security">
          <Paragraph>
            Reasonable technical and organizational safeguards are used to
            protect information. These may include:
          </Paragraph>
          <List
            items={[
              "Encryption in transit",
              "Access controls",
              "Authentication protections",
              "Infrastructure security measures provided by service providers",
            ]}
          />
          <Paragraph>
            No internet-based service can guarantee absolute security.
          </Paragraph>
        </Section>

        <Section number={9} title="Your rights and choices">
          <Paragraph>
            Depending on your location, you may have rights regarding personal
            information. You may request:
          </Paragraph>
          <List
            items={[
              "Access to personal information we hold about you",
              "Correction of inaccurate information",
              "Deletion of your account and associated personal information",
              "Information about how your personal information is used",
            ]}
          />
          <Paragraph>
            Requests can be sent to <SupportLink />.
          </Paragraph>
          <Paragraph>
            Identity verification may be required before fulfilling certain
            requests.
          </Paragraph>
        </Section>

        <Section number={10} title="California privacy notice">
          <Paragraph>
            If you are a California resident, you may have privacy rights under
            applicable California law, including rights relating to access and
            deletion of certain personal information.
          </Paragraph>
          <Paragraph>
            Cause Compass does not sell personal information.
          </Paragraph>
          <Paragraph>
            Privacy requests may be sent to <SupportLink />.
          </Paragraph>
        </Section>

        <Section number={11} title="International users">
          <Paragraph>
            Cause Compass is operated from the United States.
          </Paragraph>
          <Paragraph>
            If you access the Service from outside the United States, your
            information may be transferred to and processed in the United
            States or other jurisdictions where service providers operate.
          </Paragraph>
          <Paragraph>
            By using the Service, you consent to those transfers.
          </Paragraph>
        </Section>

        <Section number={12} title="Children's privacy">
          <Paragraph>
            Cause Compass is not intended for children under 13.
          </Paragraph>
          <Paragraph>
            We do not knowingly collect personal information from children
            under 13.
          </Paragraph>
          <Paragraph>
            If you believe a child has submitted personal information, contact{" "}
            <SupportLink />.
          </Paragraph>
        </Section>

        <Section number={13} title="Changes to this Privacy Policy">
          <Paragraph>This Privacy Policy may be updated periodically.</Paragraph>
          <Paragraph>
            When updates are made, the effective date at the top will be
            updated.
          </Paragraph>
          <Paragraph>
            If material changes are made, additional notice may be provided
            where appropriate.
          </Paragraph>
          <Paragraph>
            Continued use of the Service after changes become effective
            constitutes acceptance of the updated Privacy Policy.
          </Paragraph>
        </Section>

        <Section number={14} title="Contact">
          <Paragraph>Privacy questions or requests:</Paragraph>
          <Paragraph>
            <SupportLink />
          </Paragraph>
        </Section>
      </div>
    </main>
  );
}
