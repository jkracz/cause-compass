import { Badge } from "@/components/ui/badge";
import { GlassmorphicCard } from "@/components/glassmorphic-card";
import { Cause } from "@/lib/schemas";

interface JourneyCardProps {
  likedOrgs: Cause[];
}

export function JourneyCard({ likedOrgs }: JourneyCardProps) {
  // Get unique categories from liked organizations
  const getUniqueCategoriesFromLikedOrgs = () => {
    const categories = new Set<string>();
    likedOrgs.forEach((org) => {
      org.keywords?.forEach((keyword) => categories.add(keyword));
    });
    return Array.from(categories);
  };

  const uniqueCategories = getUniqueCategoriesFromLikedOrgs();
  const mosaicProgress = Math.min((likedOrgs.length / 10) * 100, 100); // Progress based on 10 orgs max

  return (
    <GlassmorphicCard>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-600">
          <span className="text-xl">🧭</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Your Journey</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-white/90">
            <span>Organizations liked</span>
            <span className="font-semibold">{likedOrgs.length}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-1000 ease-out"
              style={{ width: `${mosaicProgress}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-white/90">
            <span>Categories explored</span>
            <span className="font-semibold">{uniqueCategories.length}</span>
          </div>
        </div>

        {uniqueCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-white/70">Your interests:</p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueCategories.slice(0, 6).map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-white/15 text-xs transition-all duration-300 hover:bg-white/25"
                >
                  {category}
                </Badge>
              ))}
              {uniqueCategories.length > 6 && (
                <Badge
                  variant="secondary"
                  className="bg-white/15 text-xs transition-all duration-300 hover:bg-white/25"
                >
                  +{uniqueCategories.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassmorphicCard>
  );
}
