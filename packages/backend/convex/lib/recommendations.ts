import type { Doc } from "../_generated/dataModel";

export type RecommendationReasonCode =
  | "cause_match"
  | "scope_match"
  | "location_match"
  | "help_method_fit"
  | "profile_quality";

export type RecommendationScoreBreakdown = {
  causes: number;
  scopeLocation: number;
  helpMethod: number;
  profileQuality: number;
};

export type RecommendationResult = {
  organization: Doc<"organizations">;
  score: number;
  whyThisMatch: string;
  explanationBullets: string[];
  matchedSignals: RecommendationReasonCode[];
  scoreBreakdown: RecommendationScoreBreakdown;
};

type OrganizationDoc = Doc<"organizations">;

type ScoreDetails = {
  score: number;
  scoreBreakdown: RecommendationScoreBreakdown;
  whyThisMatch: string;
  explanationBullets: string[];
  matchedSignals: RecommendationReasonCode[];
};

function getPrimaryKeyword(organization: OrganizationDoc) {
  return organization.keywords?.find((keyword) => keyword.trim())?.trim();
}

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getSeededVariantScore(seed: string, organizationSlug: string) {
  const hash = hashSeed(`${seed}:${organizationSlug}`);
  return (hash / 0xffffffff) * 4;
}

function getProfileQualityScore(organization: OrganizationDoc) {
  let score = 0;

  if (organization.mission?.trim()) {
    score += 4;
  }
  if (organization.whySupport?.trim()) {
    score += 4;
  }
  if (organization.keywords?.length) {
    score += 1;
  }
  if (organization.geographicFocus) {
    score += 1;
  }

  return Math.min(score, 10);
}

function buildWhyThisMatch(
  organization: OrganizationDoc,
  hasProfileQuality = false,
) {
  const primaryKeyword = getPrimaryKeyword(organization);

  if (hasProfileQuality) {
    if (primaryKeyword) {
      return `Clear mission and strong detail around ${primaryKeyword.toLowerCase()}.`;
    }
    return "Clear mission and strong profile information.";
  }

  return "Well-described organization with defined impact focus.";
}

function buildExplanationBullets(
  organization: OrganizationDoc,
  hasProfileQuality = false,
) {
  const bullets: string[] = [];
  const primaryKeyword = getPrimaryKeyword(organization);

  if (primaryKeyword && bullets.length < 3) {
    bullets.push(`Specifically highlights ${primaryKeyword.toLowerCase()}.`);
  }

  if (hasProfileQuality && bullets.length < 3) {
    bullets.push("Has a clear mission and strong organization details.");
  }

  if (bullets.length === 0) {
    bullets.push("Has a clear mission and strong organization details.");
    bullets.push("Includes enough profile information to evaluate quickly.");
  }

  if (bullets.length === 1) {
    bullets.push("Provides useful context about its mission and impact focus.");
  }

  return bullets.slice(0, 3);
}

export function scoreRecommendation(
  organization: OrganizationDoc,
): ScoreDetails {
  const profileQualityScore = getProfileQualityScore(organization);

  const matchedSignals: RecommendationReasonCode[] = [];
  if (profileQualityScore > 0) {
    matchedSignals.push("profile_quality");
  }

  const whyThisMatch = buildWhyThisMatch(organization, profileQualityScore > 0);

  return {
    score: profileQualityScore,
    scoreBreakdown: {
      causes: 0,
      scopeLocation: 0,
      helpMethod: 0,
      profileQuality: profileQualityScore,
    },
    whyThisMatch,
    explanationBullets: buildExplanationBullets(
      organization,
      profileQualityScore > 0,
    ),
    matchedSignals,
  };
}

export function applyDiversityPass(
  recommendations: RecommendationResult[],
  limit: number,
) {
  const selected: RecommendationResult[] = [];
  const deferred: RecommendationResult[] = [];
  const majorCounts = new Map<string, number>();
  const target = Math.min(limit, recommendations.length);

  for (const recommendation of recommendations) {
    if (selected.length >= target) {
      break;
    }

    const nteeMajor = recommendation.organization.nteeMajor ?? "__unknown__";
    const currentCount = majorCounts.get(nteeMajor) ?? 0;
    const hasAlternative = recommendations.some(
      (candidate) =>
        !selected.includes(candidate) &&
        !deferred.includes(candidate) &&
        (candidate.organization.nteeMajor ?? "__unknown__") !== nteeMajor,
    );

    if (selected.length < 10 && currentCount >= 2 && hasAlternative) {
      deferred.push(recommendation);
      continue;
    }

    selected.push(recommendation);
    majorCounts.set(nteeMajor, currentCount + 1);
  }

  for (const recommendation of deferred) {
    if (selected.length >= target) {
      break;
    }
    selected.push(recommendation);
  }

  return selected;
}
