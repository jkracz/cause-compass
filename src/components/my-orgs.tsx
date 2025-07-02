"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { OrganizationCard } from "@/components/organization-card";
import { ControlPanel } from "@/components/control-panel";
import type { MockOrganization } from "@/lib/types";
import { OrganizationModal } from "@/components/organization-modal";
import { UserPreferences } from "@/lib/schemas/user";
import { clearUserSession } from "@/lib/actions/user";

export function MyOrgs({
  userPreferences,
}: {
  userPreferences: UserPreferences;
}) {
  const router = useRouter();
  const [likedOrgs, setLikedOrgs] = useState<MockOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<MockOrganization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

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

  const handleEditReflection = () => {
    router.push("/onboarding");
  };

  const handleAnswerMoreQuestions = () => {
    // TODO: Implement follow-up questions feature
    console.log("Answer more questions clicked");
  };

  const handleGetMoreMatches = () => {
    router.push("/discover");
  };

  const handleStartOver = async () => {
    // Clear all stored data
    localStorage.removeItem("likedOrganizations");
    localStorage.removeItem("userPreferences");

    // Clear the hasVisited cookie
    document.cookie =
      "hasVisited=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Reset local state
    setLikedOrgs([]);
    await clearUserSession();

    // Redirect to onboarding
    router.push("/onboarding");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative w-full flex-1">
        <div className="relative z-10 container mx-auto px-16 py-12 pr-16 md:pr-4">
          <div className="mb-8 flex items-center justify-center">
            <h1 className="text-2xl font-bold">My Organizations</h1>
          </div>

          {likedOrgs.length === 0 ? (
            <GlassmorphicCard className="mx-auto max-w-md text-center">
              <h2 className="mb-4 text-xl font-semibold">
                No organizations yet
              </h2>
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

        {/* Control Panel */}
        <ControlPanel
          userPreferences={userPreferences}
          likedOrgs={likedOrgs}
          onEditReflection={handleEditReflection}
          onAnswerMoreQuestions={handleAnswerMoreQuestions}
          onGetMoreMatches={handleGetMoreMatches}
          onStartOver={handleStartOver}
        />

        {selectedOrg && (
          <OrganizationModal
            organization={selectedOrg}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onRemove={() => handleRemoveOrganization(selectedOrg.id)}
            showRemoveButton={true}
          />
        )}

        <AlertDialog
          open={isResetDialogOpen}
          onOpenChange={setIsResetDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Your Journey?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all your saved organizations and preferences.
                You'll be able to answer the mirror questions again and start
                fresh. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleStartOver}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
