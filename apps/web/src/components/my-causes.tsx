"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import posthog from "posthog-js";

import { EditorialOrgCard } from "@/components/editorial/editorial-org-card";
import { DynamicOrganizationModal } from "@/components/dynamic-organization-modal";
import { PortraitHeader } from "@/components/my-causes/portrait-header";
import { PortraitBlock } from "@/components/my-causes/portrait-block";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import {
  buildPortraitSentence,
  computePortraitStats,
} from "@/lib/compass-axes";

type Organization = Doc<"organizations">;

export function MyCauses({ likedOrgs }: { likedOrgs: Organization[] }) {
  const router = useRouter();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const organizations = useMemo(() => likedOrgs, [likedOrgs]);
  const count = organizations.length;

  const stats = useMemo(
    () => computePortraitStats(organizations),
    [organizations],
  );
  const portraitSentence = useMemo(() => buildPortraitSentence(stats), [stats]);

  const handleOpenModal = (org: Organization, source: string) => {
    setSelectedOrg(org);
    setIsModalOpen(true);

    posthog.capture("organization_details_viewed", {
      organization_id: org.slug,
      organization_name: org.name,
      organization_ein: org.ein,
      organization_city: org.city,
      organization_state: org.state,
      source,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-12 md:space-y-16">
      <PortraitHeader sentence={portraitSentence} />

      {count > 0 && (
        <PortraitBlock
          liked={organizations}
          stats={stats}
          onSelect={(org) => handleOpenModal(org, "my_causes_constellation")}
        />
      )}

      {count === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center rounded-[var(--rounded-hero,2rem)] border border-[var(--rule)] bg-white/70 px-8 py-12 text-center backdrop-blur-sm">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)]">
            <Heart className="h-6 w-6 fill-[var(--accent)]/20 text-[var(--accent)]" />
          </div>
          <h3 className="font-heading mb-2 text-[22px] leading-[1.15] font-semibold text-[var(--ink)]">
            Nothing saved yet
          </h3>
          <p className="mb-6 max-w-sm text-[14px] leading-[1.55] text-[var(--ink-soft)]">
            Wander through Discover and tap the heart on anything that catches
            your eye. They&apos;ll collect here.
          </p>
          <button
            type="button"
            onClick={() => router.push("/discover")}
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-[11px] font-semibold tracking-[0.32em] text-[var(--paper)] uppercase transition-all duration-200 hover:bg-[var(--accent)] hover:shadow-[0_18px_40px_-20px_rgba(200,38,110,0.55)]"
          >
            Go to Discover
          </button>
        </div>
      ) : (
        <section className="w-full">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {organizations.map((org) => (
              <EditorialOrgCard
                key={org.slug}
                organization={org}
                onClick={() => handleOpenModal(org, "my_causes")}
              />
            ))}
          </div>
        </section>
      )}

      {selectedOrg && (
        <DynamicOrganizationModal
          organization={selectedOrg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
