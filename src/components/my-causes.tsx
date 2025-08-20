"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { OrganizationCard } from "@/components/organization-card";
import type { MockOrganization } from "@/lib/types";
import { OrganizationModal } from "@/components/organization-modal";

export function MyCauses() {
  const router = useRouter();
  const [likedOrgs, setLikedOrgs] = useState<MockOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<MockOrganization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load liked organizations from localStorage
    const savedLikedOrgs = localStorage.getItem("likedOrganizations");
    if (savedLikedOrgs) {
      setLikedOrgs(JSON.parse(savedLikedOrgs));
    }
  }, []);

  const handleOpenModal = (org: MockOrganization) => {
    setSelectedOrg(org);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRemoveOrganization = (orgId: string) => {
    const updatedOrgs = likedOrgs.filter((org) => org.id !== orgId);
    setLikedOrgs(updatedOrgs);
    localStorage.setItem("likedOrganizations", JSON.stringify(updatedOrgs));
  };

  return (
    <div>
      <div className="relative z-10 container mx-auto px-16 py-12 pr-16 md:pr-4">
        <div className="mb-8 flex items-center justify-center">
          <h2 className="text-2xl font-bold">Liked Causes</h2>
        </div>

        {likedOrgs.length === 0 ? (
          <GlassmorphicCard className="mx-auto max-w-md text-center">
            <h2 className="mb-4 text-xl font-semibold">No organizations yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't liked any organizations yet. Go to the discover page
              to find organizations that match your interests.
            </p>
            <Button onClick={() => router.push("/discover")}>
              Discover Organizations
            </Button>
          </GlassmorphicCard>
        ) : (
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {likedOrgs.map((org) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                onClick={() => handleOpenModal(org)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrg && (
        <OrganizationModal
          organization={selectedOrg}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onRemove={() => handleRemoveOrganization(selectedOrg.id)}
          showRemoveButton={true}
        />
      )}
    </div>
  );
}
