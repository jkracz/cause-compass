import { BackButton } from "@/components/back-button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 container mx-auto px-4 py-12">
        <BackButton fallbackHref="/" />

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold text-white">
              Terms & Conditions
            </h1>
            <p className="text-white/70">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <GlassmorphicCard className="prose prose-invert max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="mb-3 text-xl font-semibold">
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground">
                  By accessing and using Cause Compass, you accept and agree to
                  be bound by the terms and provision of this agreement. If you
                  do not agree to abide by the above, please do not use this
                  service.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">2. Use License</h2>
                <p className="text-muted-foreground mb-3">
                  Permission is granted to temporarily use Cause Compass for
                  personal, non-commercial transitory viewing only. This is the
                  grant of a license, not a transfer of title, and under this
                  license you may not:
                </p>
                <ul className="text-muted-foreground list-inside list-disc space-y-1">
                  <li>modify or copy the materials</li>
                  <li>
                    use the materials for any commercial purpose or for any
                    public display
                  </li>
                  <li>
                    attempt to reverse engineer any software contained on the
                    website
                  </li>
                  <li>
                    remove any copyright or other proprietary notations from the
                    materials
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">3. User Accounts</h2>
                <p className="text-muted-foreground">
                  When you create an account with us, you must provide
                  information that is accurate, complete, and current at all
                  times. You are responsible for safeguarding the password and
                  for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">
                  4. Privacy Policy
                </h2>
                <p className="text-muted-foreground">
                  Your privacy is important to us. Our Privacy Policy explains
                  how we collect, use, and protect your information when you use
                  our service. By using our service, you agree to the collection
                  and use of information in accordance with our Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">
                  5. Nonprofit Information
                </h2>
                <p className="text-muted-foreground">
                  While we strive to provide accurate and up-to-date information
                  about nonprofits, we cannot guarantee the completeness or
                  accuracy of all information. Users should verify information
                  independently before making donations or commitments.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">
                  6. Prohibited Uses
                </h2>
                <p className="text-muted-foreground mb-3">
                  You may not use our service:
                </p>
                <ul className="text-muted-foreground list-inside list-disc space-y-1">
                  <li>
                    For any unlawful purpose or to solicit others to perform
                    unlawful acts
                  </li>
                  <li>
                    To violate any international, federal, provincial, or state
                    regulations, rules, laws, or local ordinances
                  </li>
                  <li>
                    To infringe upon or violate our intellectual property rights
                    or the intellectual property rights of others
                  </li>
                  <li>
                    To harass, abuse, insult, harm, defame, slander, disparage,
                    intimidate, or discriminate
                  </li>
                  <li>To submit false or misleading information</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">7. Disclaimer</h2>
                <p className="text-muted-foreground">
                  The information on this website is provided on an 'as is'
                  basis. To the fullest extent permitted by law, this Company
                  excludes all representations, warranties, conditions and terms
                  related to our website and the use of this website.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">8. Limitations</h2>
                <p className="text-muted-foreground">
                  In no event shall Cause Compass or its suppliers be liable for
                  any damages (including, without limitation, damages for loss
                  of data or profit, or due to business interruption) arising
                  out of the use or inability to use the materials on Cause
                  Compass's website.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">
                  9. Changes to Terms
                </h2>
                <p className="text-muted-foreground">
                  We reserve the right to revise these terms of service at any
                  time without notice. By using this website, you are agreeing
                  to be bound by the then current version of these terms of
                  service.
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold">
                  10. Contact Information
                </h2>
                <p className="text-muted-foreground">
                  If you have any questions about these Terms & Conditions,
                  please contact us through our website or support channels.
                </p>
              </section>
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    </main>
  );
}
