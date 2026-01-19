"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import posthog from "posthog-js";
import { Preloaded, usePreloadedQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { OrganizationCard } from "@/components/organization-card";
import { OrganizationModal } from "@/components/organization-modal";
import { api } from "@cause/backend/convex/_generated/api";
import { Doc } from "@cause/backend/convex/_generated/dataModel";
import { removeLikedOrganization } from "@/lib/actions";

type Organization = Doc<"organizations">;

interface MyCausesProps {
  preloadedLikedOrgs: Preloaded<typeof api.organizations.getLikedByUser>;
}

export function MyCauses({ preloadedLikedOrgs }: MyCausesProps) {
  const likedOrgsFromQuery = usePreloadedQuery(preloadedLikedOrgs);
  const router = useRouter();
  const [organizations, setOrganizations] =
    useState<Organization[]>(likedOrgsFromQuery);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (org: Organization) => {
    setSelectedOrg(org);
    setIsModalOpen(true);

    // Track organization details viewed
    posthog.capture("organization_details_viewed", {
      organization_id: org.slug,
      organization_name: org.name,
      organization_ein: org.ein,
      organization_city: org.city,
      organization_state: org.state,
      source: "my_causes",
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRemoveOrganization = async (orgSlug: string) => {
    const orgToRemove = organizations.find((org) => org.slug === orgSlug);
    const updatedUser = await removeLikedOrganization(orgSlug);
    const updatedOrgs = organizations.filter((org) =>
      updatedUser?.likedOrganizations.includes(org.slug)
    );
    setOrganizations(updatedOrgs);

    // Track organization removed
    posthog.capture("organization_removed", {
      organization_id: orgSlug,
      organization_name: orgToRemove?.name,
      organization_ein: orgToRemove?.ein,
      remaining_liked_count: updatedOrgs.length,
    });
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Liked Causes</h2>
        <p className="mt-2 text-sm text-white/70">
          Your curated collection of organizations making a difference
        </p>
      </div>

      {organizations.length === 0 ? (
        <GlassmorphicCard className="mx-auto max-w-md text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 ring-1 ring-white/20">
              <Heart className="h-8 w-8 fill-pink-400/20 text-pink-400" />
            </div>
          </div>
          <h2 className="mb-4 text-xl font-semibold text-white">
            No organizations yet
          </h2>
          <p className="mb-6 text-white/70">
            You haven&apos;t liked any organizations yet. Go to the discover
            page to find organizations that match your interests.
          </p>
          <Button
            onClick={() => router.push("/discover")}
            className="w-full sm:w-auto"
          >
            Discover Organizations
          </Button>
        </GlassmorphicCard>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.slug}
              organization={org}
              onClick={() => handleOpenModal(org)}
            />
          ))}
        </div>
      )}

      {selectedOrg && (
        <OrganizationModal
          organization={selectedOrg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onRemove={() => handleRemoveOrganization(selectedOrg.slug)}
          showRemoveButton={true}
        />
      )}
    </div>
  );
}
