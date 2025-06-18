import { notFound } from "next/navigation";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { mockOrganizations } from "@/lib/mock-data";

interface OrgPageProps {
  params: {
    id: string;
  };
}

export default function OrgPage({ params }: OrgPageProps) {
  const organization = mockOrganizations.find((org) => org.id === params.id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative w-full flex-1">
        <div className="relative z-10 container mx-auto max-w-4xl px-4 py-12">
          <BackButton fallbackHref="/discover" />

          <div className="space-y-6">
            {/* Hero Image */}
            <div className="relative h-64 w-full overflow-hidden rounded-xl">
              <Image
                src={organization.imageUrl || "/placeholder.svg"}
                alt={organization.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
            </div>

            {/* Organization Info */}
            <GlassmorphicCard>
              <div className="space-y-6">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-white">
                    {organization.name}
                  </h1>
                  <p className="text-lg text-white/70">
                    {organization.location}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {organization.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div>
                  <h2 className="mb-3 text-xl font-semibold text-white">
                    About
                  </h2>
                  <p className="leading-relaxed text-white/90">
                    {organization.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-white">
                        Founded
                      </h3>
                      <p className="text-white/90">{organization.founded}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-white">
                        Impact
                      </h3>
                      <p className="text-white/90">{organization.impact}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4">
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" className="w-full">
                      Visit Website
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </GlassmorphicCard>
          </div>
        </div>
      </main>
    </div>
  );
}
