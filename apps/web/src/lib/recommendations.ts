import { Doc } from "@cause/backend/convex/_generated/dataModel";

export type RecommendationReasonCode =
  | "cause_match"
  | "scope_match"
  | "location_match"
  | "help_method_fit"
  | "profile_quality";

export type RecommendationResult = {
  organization: Doc<"organizations">;
  score: number;
  whyThisMatch: string;
  explanationBullets: string[];
  matchedSignals: RecommendationReasonCode[];
  scoreBreakdown: {
    causes: number;
    scopeLocation: number;
    helpMethod: number;
    profileQuality: number;
  };
};

export const RECOMMENDATION_VERSION = "rules_v1";
