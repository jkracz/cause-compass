"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, X } from "lucide-react";

import { SwipeableCard } from "@/components/swipeable-card";
import { Button } from "@/components/ui/button";
import { mockOrganizations } from "@/lib/mock-data";
import type { Organization } from "@/lib/types";

export default function DiscoverPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedOrgs, setLikedOrgs] = useState<Organization[]>([]);
  const [userPreferences, setUserPreferences] = useState<Record<string, any>>(
    {},
  );

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user preferences from database
        const { getUserPreferencesAction, getLikedOrganizationsAction } = await import("@/lib/actions/user");
        
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

    // TODO: Load organizations from DB
    setOrganizations(mockOrganizations);
    loadUserData();
  }, []);

  const handleLike = async () => {
    if (currentIndex < organizations.length) {
      const org = organizations[currentIndex];
      
      try {
        // Add to database
        const { addLikedOrganization } = await import("@/lib/actions/user");
        await addLikedOrganization(org.id);
        
        // Update local state
        const updatedLikedOrgs = [...likedOrgs, org];
        setLikedOrgs(updatedLikedOrgs);
      } catch (error) {
        console.error("Error adding liked organization:", error);
        // Still update local state as fallback
        const updatedLikedOrgs = [...likedOrgs, org];
        setLikedOrgs(updatedLikedOrgs);
      }
      
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < organizations.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleViewMyOrgs = () => {
    router.push("/my-orgs");
  };

  const currentOrg = organizations[currentIndex];
  const isFinished = currentIndex >= organizations.length;

  return (
    <main className="relative min-h-screen w-full">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {isFinished ? (
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">
              You&apos;ve seen all organizations!
            </h2>
            <p className="mb-8 text-lg">
              You liked {likedOrgs.length} organizations.
            </p>
            <Button size="lg" onClick={handleViewMyOrgs}>
              View My Organizations
            </Button>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-md flex-col items-center">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold">Discover Organizations</h1>
              <p className="text-muted-foreground">
                Swipe right to like, left to skip
              </p>
            </div>

            <div className="relative mb-8 h-[500px] w-full">
              <SwipeableCard
                organization={currentOrg}
                onSwipeLeft={handleSkip}
                onSwipeRight={handleLike}
              />
            </div>

            <div className="mb-8 flex gap-4">
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-14 rounded-full p-0"
                onClick={handleSkip}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Skip</span>
              </Button>

              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-pink-600 p-0 hover:bg-pink-700"
                onClick={handleLike}
              >
                <Heart className="h-6 w-6" />
                <span className="sr-only">Like</span>
              </Button>
            </div>

            {/* Reserved space for the "View My Organizations" button to prevent layout shift */}
            <div className="flex h-10 items-center justify-center">
              {likedOrgs.length > 0 && (
                <Button variant="outline" onClick={handleViewMyOrgs}>
                  View My Organizations ({likedOrgs.length})
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
