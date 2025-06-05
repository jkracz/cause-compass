import { BackButton } from "@/components/back-button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Cause Compass?",
      answer:
        "Cause Compass is a platform that helps you discover nonprofits that align with your values and interests. Through our unique mirror check process, we match you with organizations where you can make a meaningful impact.",
    },
    {
      question: "How does the matching process work?",
      answer:
        "Our matching process starts with a series of thoughtful questions about your values, interests, and preferred ways to help. We then use this information to recommend nonprofits that align with your passions and goals.",
    },
    {
      question: "Is Cause Compass free to use?",
      answer:
        "Yes! Cause Compass is completely free to use. We believe everyone should have access to tools that help them make a positive impact in the world.",
    },
    {
      question: "How do you verify the nonprofits on your platform?",
      answer:
        "We carefully vet all nonprofits on our platform to ensure they are legitimate, registered organizations with a track record of positive impact. We regularly update our database to maintain accuracy.",
    },
    {
      question:
        "Can I change my preferences after completing the mirror check?",
      answer:
        "You can edit your reflection and answer additional questions at any time through your Control Center. This helps us provide better matches as your interests evolve.",
    },
    {
      question: "How can I get involved with the organizations I discover?",
      answer:
        "Each organization profile includes information about how you can get involved, whether through volunteering, donating, sharing their mission, or other forms of support. You can visit their websites directly to learn more.",
    },
    {
      question: "Do you share my personal information with nonprofits?",
      answer:
        "No, we do not share your personal information with any organizations. Your privacy is important to us, and we only use your data to improve your experience on our platform.",
    },
    {
      question: "Can I suggest a nonprofit to be added to the platform?",
      answer:
        "We'd love to hear your suggestions! While we don't have a formal submission process yet, you can reach out to us with nonprofit recommendations and we'll consider them for inclusion.",
    },
    {
      question: "What if I can't find my location during the mirror check?",
      answer:
        "Location sharing is completely optional. If you skip it or if we can't access your location, we'll still show you amazing organizations. You can always enable location services later to see more local opportunities.",
    },
    {
      question: "How often do you add new organizations?",
      answer:
        "We're constantly working to expand our database of nonprofits. We add new organizations regularly to ensure you have access to a diverse range of causes and opportunities to make an impact.",
    },
  ];

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 container mx-auto px-4 py-12">
        <BackButton fallbackHref="/" />

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold text-white">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/70">
              Find answers to common questions about Cause Compass
            </p>
          </div>

          <GlassmorphicCard>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassmorphicCard>
        </div>
      </div>
    </main>
  );
}
