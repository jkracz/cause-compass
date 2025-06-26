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
import type { Organization } from "@/lib/types";
import { OrganizationModal } from "@/components/organization-modal";

export default function MyOrgsPage() {
  const router = useRouter();
  const [likedOrgs, setLikedOrgs] = useState<Organization[]>([]);
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>(
    {},
  );
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user data from database
        const { getUserPreferencesAction, getLikedOrganizationsAction } = await import("@/lib/actions/user");
        const { mockOrganizations } = await import("@/lib/mock-data");
        
        const preferences = await getUserPreferencesAction();
        if (preferences) {
          setUserPreferences(preferences);
        }

        // Load liked organizations from database
        const likedOrgIds = await getLikedOrganizationsAction();
        // TODO: Convert IDs to full organization objects when we have the org query
        // For now, we'll use mock data filtering
        const likedOrgObjects = mockOrganizations.filter(org => likedOrgIds.includes(org.id));
        setLikedOrgs(likedOrgObjects);
        
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handleOpenModal = (org: Organization) => {
    setSelectedOrg(org);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRemoveOrganization = async (orgId: string) => {
    try {
      // Remove from database
      const { removeLikedOrganization } = await import("@/lib/actions/user");
      await removeLikedOrganization(orgId);
      
      // Update local state
      const updatedOrgs = likedOrgs.filter((org) => org.id !== orgId);
      setLikedOrgs(updatedOrgs);
    } catch (error) {
      console.error("Error removing organization:", error);
      // Still update local state as fallback
      const updatedOrgs = likedOrgs.filter((org) => org.id !== orgId);
      setLikedOrgs(updatedOrgs);
    }
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
    try {
      // Clear all user data from database
      const { clearUserSession } = await import("@/lib/actions/user");
      await clearUserSession();
      // Navigation will be handled by the server action
    } catch (error) {
      console.error("Error clearing user data:", error);
      // Fallback: clear local state and redirect
      setLikedOrgs([]);
      setUserPreferences({});
      router.push("/onboarding");
    }
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
