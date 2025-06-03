import { BackButton } from "@/components/back-button"
import { GlassmorphicCard } from "@/components/glassmorphic-card"

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen w-full">
      <div className="container relative z-10 mx-auto px-4 py-12">
        <BackButton fallbackHref="/" />

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-white/70">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <GlassmorphicCard className="prose prose-invert max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <p className="text-muted-foreground mb-3">
                  We collect information you provide directly to us, such as when you:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Complete our mirror check questionnaire</li>
                  <li>Create an account or profile</li>
                  <li>Contact us for support</li>
                  <li>Interact with nonprofits through our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-3">We use the information we collect to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Match you with relevant nonprofits</li>
                  <li>Improve our matching algorithm</li>
                  <li>Provide customer support</li>
                  <li>Send you updates about organizations you've liked</li>
                  <li>Improve our services and user experience</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
                <p className="text-muted-foreground">
                  We do not sell, trade, or otherwise transfer your personal information to third parties. We may share
                  aggregated, non-personally identifiable information for research and analytics purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information against unauthorized
                  access, alteration, disclosure, or destruction. However, no method of transmission over the internet
                  is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Location Information</h2>
                <p className="text-muted-foreground">
                  If you choose to share your location, we use this information solely to show you local nonprofit
                  opportunities. Location sharing is entirely optional and can be disabled at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience, remember your preferences, and
                  analyze how our service is used. You can control cookie settings through your browser.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
                <p className="text-muted-foreground mb-3">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of communications</li>
                  <li>Export your data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our service is not intended for children under 13. We do not knowingly collect personal information
                  from children under 13. If we become aware that we have collected such information, we will take steps
                  to delete it.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the
                  new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us through our website or support
                  channels.
                </p>
              </section>
            </div>
          </GlassmorphicCard>
        </div>
      </div>
    </main>
  )
}
