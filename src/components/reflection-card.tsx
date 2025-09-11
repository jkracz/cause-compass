"use client";

import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { Cause, UserPreferences } from "@/lib/schemas";
import { useRouter } from "next/navigation";

interface ReflectionCardProps {
  userPreferences: UserPreferences;
  likedOrgs: Cause[];
}

export function ReflectionCard({
  userPreferences,
  likedOrgs,
}: ReflectionCardProps) {
  const router = useRouter();
  const handleEditReflection = () => {
    router.push("/onboarding");
  };

  // Generate reflection summary from user preferences
  const generateReflectionSummary = () => {
    if (!userPreferences || Object.keys(userPreferences).length === 0) {
      return "Complete your mirror check to see your reflection here.";
    }

    const causes = userPreferences.causes || [];
    const helpMethod = userPreferences.helpMethod || [];
    const changeScope = userPreferences.changeScope || "global";

    let summary = "You care deeply about ";

    if (causes.length > 0) {
      const causeLabels = causes.map((cause: string) => {
        const causeMap: Record<string, string> = {
          environment: "environmental protection",
          education: "education",
          health: "health & wellness",
          poverty: "fighting poverty",
          rights: "human rights",
          arts: "arts & culture",
          animals: "animal welfare",
          disaster: "disaster relief",
          "mental-health": "mental health",
          food: "food security",
          technology: "technology innovation",
          community: "community development",
        };
        return causeMap[cause] || cause;
      });

      if (causeLabels.length === 1) {
        summary += causeLabels[0];
      } else if (causeLabels.length === 2) {
        summary += `${causeLabels[0]} and ${causeLabels[1]}`;
      } else {
        summary += `${causeLabels.slice(0, -1).join(", ")}, and ${causeLabels[causeLabels.length - 1]}`;
      }
    } else {
      summary += "making a positive impact";
    }

    if (changeScope === "local") {
      summary += " in your local community";
    } else if (changeScope === "national") {
      summary += " across the country";
    } else {
      summary += " wherever it matters most";
    }

    if (helpMethod.length > 0) {
      const methodLabels = helpMethod.map((method: string) => {
        const methodMap: Record<string, string> = {
          donating: "donating",
          volunteering: "volunteering",
          sharing: "sharing information",
          connecting: "connecting people",
          learning: "learning more",
        };
        return methodMap[method] || method;
      });

      summary += ". You prefer to help through ";
      if (methodLabels.length === 1) {
        summary += methodLabels[0];
      } else if (methodLabels.length === 2) {
        summary += `${methodLabels[0]} and ${methodLabels[1]}`;
      } else {
        summary += `${methodLabels.slice(0, -1).join(", ")}, and ${methodLabels[methodLabels.length - 1]}`;
      }
    }

    summary += ".";
    return summary;
  };

  // Get unique categories from liked organizations
  const getUniqueCategoriesFromLikedOrgs = () => {
    const categories = new Set<string>();
    likedOrgs.forEach((org) => {
      org.keywords?.forEach((keyword) => categories.add(keyword));
    });
    return Array.from(categories);
  };

  const uniqueCategories = getUniqueCategoriesFromLikedOrgs();

  return (
    <GlassmorphicCard>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-600">
          <span className="text-xl">🪞</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Your Reflection</h2>
      </div>

      <p className="mb-4 leading-relaxed text-white/90">
        {generateReflectionSummary()}
      </p>

      {/* Interest visualization */}
      {uniqueCategories.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-1">
            {uniqueCategories.slice(0, 6).map((category, index) => (
              <div
                key={category}
                className="relative overflow-hidden rounded-md border border-white/10 bg-gradient-to-r from-white/10 to-white/5 px-2 py-1 text-xs text-white/90 backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, hsla(${(index * 60) % 360}, 70%, 60%, 0.15), hsla(${(index * 60 + 30) % 360}, 70%, 60%, 0.05))`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at 20% 50%, hsla(${(index * 60) % 360}, 80%, 70%, 0.3), transparent 50%)`,
                  }}
                />
                <span className="relative z-10">{category}</span>
              </div>
            ))}
            {uniqueCategories.length > 6 && (
              <div className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/70">
                +{uniqueCategories.length - 6} more
              </div>
            )}
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min((uniqueCategories.length / 8) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${uniqueCategories
                  .slice(0, 3)
                  .map(
                    (_, index) => `hsla(${(index * 120) % 360}, 70%, 60%, 0.8)`,
                  )
                  .join(", ")})`,
              }}
            />
          </div>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full border-white/20 bg-white/10 text-white transition-all duration-300 hover:bg-white/20"
        onClick={handleEditReflection}
      >
        <Edit3 className="mr-2 h-4 w-4" />
        Edit my reflection
      </Button>
    </GlassmorphicCard>
  );
}
