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

type UserPreferences = Doc<"users">["preferences"];
type OrganizationDoc = Doc<"organizations">;

type CauseConfig = {
  label: string;
  nteeMajors: string[];
  keywords: string[];
};

type ScoreDetails = {
  score: number;
  scoreBreakdown: RecommendationScoreBreakdown;
  whyThisMatch: string;
  explanationBullets: string[];
  matchedSignals: RecommendationReasonCode[];
};

export const CAUSE_CONFIG: Record<string, CauseConfig> = {
  environment: {
    label: "Environment & Climate",
    nteeMajors: ["C"],
    keywords: [
      "environment",
      "climate",
      "conservation",
      "sustainability",
      "clean energy",
      "ecology",
    ],
  },
  education: {
    label: "Education & Youth",
    nteeMajors: ["B", "O"],
    keywords: [
      "education",
      "school",
      "student",
      "youth",
      "tutoring",
      "learning",
    ],
  },
  health: {
    label: "Health & Wellness",
    nteeMajors: ["E", "G", "H"],
    keywords: [
      "health",
      "wellness",
      "medical",
      "hospital",
      "care",
      "research",
    ],
  },
  poverty: {
    label: "Poverty & Housing",
    nteeMajors: ["L", "P", "S", "K"],
    keywords: [
      "poverty",
      "housing",
      "homeless",
      "shelter",
      "economic mobility",
      "basic needs",
    ],
  },
  rights: {
    label: "Human Rights & Justice",
    nteeMajors: ["R", "I", "W"],
    keywords: [
      "rights",
      "justice",
      "civil rights",
      "legal aid",
      "equity",
      "advocacy",
    ],
  },
  arts: {
    label: "Arts & Culture",
    nteeMajors: ["A"],
    keywords: [
      "arts",
      "culture",
      "museum",
      "music",
      "theater",
      "creative",
    ],
  },
  animals: {
    label: "Animal Welfare",
    nteeMajors: ["D"],
    keywords: [
      "animal",
      "wildlife",
      "rescue",
      "shelter",
      "pet",
      "habitat",
    ],
  },
  disaster: {
    label: "Disaster Relief",
    nteeMajors: ["M", "P", "Q"],
    keywords: [
      "disaster",
      "relief",
      "emergency",
      "humanitarian",
      "recovery",
      "crisis",
    ],
  },
  "mental-health": {
    label: "Mental Health",
    nteeMajors: ["F"],
    keywords: [
      "mental health",
      "counseling",
      "therapy",
      "wellbeing",
      "trauma",
      "support",
    ],
  },
  food: {
    label: "Food Security",
    nteeMajors: ["K", "P"],
    keywords: [
      "food",
      "hunger",
      "nutrition",
      "meals",
      "pantry",
      "agriculture",
    ],
  },
  technology: {
    label: "Technology & Innovation",
    nteeMajors: ["U", "H"],
    keywords: [
      "technology",
      "innovation",
      "science",
      "engineering",
      "digital",
      "research",
    ],
  },
  community: {
    label: "Community Development",
    nteeMajors: ["S", "W", "P"],
    keywords: [
      "community",
      "neighborhood",
      "development",
      "civic",
      "local",
      "grassroots",
    ],
  },
};

const SCOPE_CONFIG: Record<
  NonNullable<UserPreferences["changeScope"]>,
  {
    label: string;
    exact: OrganizationDoc["geographicFocus"][];
    adjacent: OrganizationDoc["geographicFocus"][];
  }
> = {
  local: {
    label: "local community impact",
    exact: ["Local"],
    adjacent: ["Regional"],
  },
  national: {
    label: "national impact",
    exact: ["National"],
    adjacent: [],
  },
  global: {
    label: "global impact",
    exact: ["Global"],
    adjacent: ["National"],
  },
};

const HELP_METHOD_LABELS: Record<string, string> = {
  donating: "donating",
  volunteering: "volunteering",
  sharing: "sharing information",
  connecting: "connecting people",
  learning: "learning more",
};

const VOLUNTEERING_TERMS = [
  "volunteer",
  "volunteering",
  "mentor",
  "hands-on",
  "community service",
  "serve",
];

const CONNECTING_TERMS = [
  "community",
  "network",
  "partnership",
  "coalition",
  "connect",
  "collaboration",
];

const STATE_NAME_TO_CODE: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

function normalizeState(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  return STATE_NAME_TO_CODE[trimmed];
}

function normalizeText(value?: string | null) {
  return value?.toLowerCase().trim() ?? "";
}

function hasAnyTerm(haystack: string, terms: string[]) {
  return terms.some((term) => haystack.includes(term));
}

function buildSearchText(organization: OrganizationDoc) {
  return normalizeText(
    [
      organization.name,
      organization.tagline,
      organization.oneSentenceSummary,
      organization.mission,
      organization.whySupport,
      organization.targetAudience,
      organization.keywords?.join(" "),
      organization.activities
        ?.map((activity) => `${activity.name} ${activity.description}`)
        .join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function uniqueOrdered<T>(values: T[]) {
  return Array.from(new Set(values));
}

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
  return (hash % 400) / 100;
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

function scoreCauses(
  organization: OrganizationDoc,
  preferences: UserPreferences,
  searchText: string,
) {
  let score = 0;
  const matchedLabels: string[] = [];

  for (const cause of preferences.causes ?? []) {
    const config = CAUSE_CONFIG[cause];
    if (!config) {
      continue;
    }

    if (
      organization.nteeMajor &&
      config.nteeMajors.includes(organization.nteeMajor)
    ) {
      score += 20;
      matchedLabels.push(config.label);
      continue;
    }

    if (hasAnyTerm(searchText, config.keywords)) {
      score += 8;
      matchedLabels.push(config.label);
    }
  }

  return {
    score: Math.min(score, 50),
    matchedLabels: uniqueOrdered(matchedLabels),
  };
}

function scoreHelpMethod(
  organization: OrganizationDoc,
  preferences: UserPreferences,
  searchText: string,
) {
  let score = 0;
  const matchedMethods: string[] = [];
  const hasLocalFocus =
    organization.geographicFocus === "Local" ||
    organization.geographicFocus === "Regional";

  for (const method of preferences.helpMethod ?? []) {
    switch (method) {
      case "donating": {
        const methodScore =
          (organization.donationUrl ? 6 : 0) +
          (organization.whySupport?.trim() || organization.websiteUrl ? 2 : 0);
        if (methodScore > 0) {
          score += methodScore;
          matchedMethods.push(HELP_METHOD_LABELS[method] ?? method);
        }
        break;
      }
      case "volunteering": {
        const methodScore =
          (hasLocalFocus ? 6 : 0) +
          (hasAnyTerm(searchText, VOLUNTEERING_TERMS) ? 2 : 0);
        if (methodScore > 0) {
          score += methodScore;
          matchedMethods.push(HELP_METHOD_LABELS[method] ?? method);
        }
        break;
      }
      case "sharing": {
        const hasSocialMedia = Boolean(
          organization.socialMediaUrls &&
            Object.values(organization.socialMediaUrls).some(Boolean),
        );
        const methodScore =
          (hasSocialMedia ? 6 : 0) +
          (organization.tagline?.trim() || organization.whySupport?.trim()
            ? 2
            : 0);
        if (methodScore > 0) {
          score += methodScore;
          matchedMethods.push(HELP_METHOD_LABELS[method] ?? method);
        }
        break;
      }
      case "connecting": {
        const methodScore =
          (hasLocalFocus ? 4 : 0) +
          (hasAnyTerm(searchText, CONNECTING_TERMS) ? 4 : 0);
        if (methodScore > 0) {
          score += methodScore;
          matchedMethods.push(HELP_METHOD_LABELS[method] ?? method);
        }
        break;
      }
      case "learning": {
        const methodScore =
          (organization.mission?.trim() ? 4 : 0) +
          (organization.activities?.length ? 2 : 0) +
          (organization.keywords?.length ? 2 : 0);
        if (methodScore > 0) {
          score += methodScore;
          matchedMethods.push(HELP_METHOD_LABELS[method] ?? method);
        }
        break;
      }
      default:
        break;
    }
  }

  return {
    score: Math.min(score, 15),
    matchedMethods: uniqueOrdered(matchedMethods),
  };
}

function buildWhyThisMatch(
  organization: OrganizationDoc,
  causeLabels: string[],
  hasLocationMatch: boolean,
  matchedScopeLabel?: string,
  matchedMethods: string[] = [],
  hasProfileQuality = false,
) {
  const primaryKeyword = getPrimaryKeyword(organization);

  if (causeLabels.length > 0 && hasLocationMatch) {
    if (primaryKeyword) {
      return `Local to you and aligned with ${causeLabels[0]} through ${primaryKeyword.toLowerCase()}.`;
    }
    return `Local to you and aligned with ${causeLabels[0]}.`;
  }

  if (causeLabels.length > 0 && matchedScopeLabel) {
    if (primaryKeyword) {
      return `${causeLabels[0]} fit with ${matchedScopeLabel}, especially around ${primaryKeyword.toLowerCase()}.`;
    }
    return `${causeLabels[0]} fit with ${matchedScopeLabel}.`;
  }

  if (causeLabels.length > 0) {
    if (primaryKeyword) {
      return `Matches ${causeLabels[0]} and specifically touches ${primaryKeyword.toLowerCase()}.`;
    }
    return `Matches ${causeLabels[0]}.`;
  }

  if (hasLocationMatch && matchedScopeLabel) {
    if (primaryKeyword) {
      return `Close to your location and focused on ${matchedScopeLabel} through ${primaryKeyword.toLowerCase()}.`;
    }
    return `Close to your location and focused on ${matchedScopeLabel}.`;
  }

  if (matchedMethods.length > 0) {
    if (primaryKeyword) {
      return `A good fit for ${matchedMethods[0]}, with a focus on ${primaryKeyword.toLowerCase()}.`;
    }
    return `A good fit for ${matchedMethods[0]}.`;
  }

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
  causeLabels: string[],
  hasLocationMatch: boolean,
  matchedScopeLabel?: string,
  matchedMethods: string[] = [],
  hasProfileQuality = false,
) {
  const bullets: string[] = [];
  const primaryKeyword = getPrimaryKeyword(organization);

  if (causeLabels.length > 0) {
    const causeList = causeLabels.slice(0, 2).join(" and ");
    bullets.push(`Aligned with your interest in ${causeList}.`);
  }

  if (hasLocationMatch) {
    bullets.push(`Works near your location in ${organization.state}.`);
  }

  if (matchedScopeLabel) {
    bullets.push(`Focused on ${matchedScopeLabel}.`);
  }

  if (matchedMethods.length > 0) {
    bullets.push(`A strong fit for ${matchedMethods[0]}.`);
  }

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
  preferences: UserPreferences,
  sessionLocationState?: string,
): ScoreDetails {
  const searchText = buildSearchText(organization);
  const causeScore = scoreCauses(organization, preferences, searchText);
  const scopeLocationScore = scoreScopeAndLocationWithState(
    organization,
    preferences,
    sessionLocationState,
  );
  const helpMethodScore = scoreHelpMethod(organization, preferences, searchText);
  const profileQualityScore = getProfileQualityScore(organization);

  const matchedSignals: RecommendationReasonCode[] = [];
  if (causeScore.score > 0) {
    matchedSignals.push("cause_match");
  }
  if (scopeLocationScore.hasLocationMatch) {
    matchedSignals.push("location_match");
  }
  if (scopeLocationScore.matchedScopeLabel) {
    matchedSignals.push("scope_match");
  }
  if (helpMethodScore.score > 0) {
    matchedSignals.push("help_method_fit");
  }
  if (profileQualityScore > 0) {
    matchedSignals.push("profile_quality");
  }

  const whyThisMatch = buildWhyThisMatch(
    organization,
    causeScore.matchedLabels,
    scopeLocationScore.hasLocationMatch,
    scopeLocationScore.matchedScopeLabel,
    helpMethodScore.matchedMethods,
    profileQualityScore > 0,
  );

  return {
    score:
      causeScore.score +
      scopeLocationScore.score +
      helpMethodScore.score +
      profileQualityScore,
    scoreBreakdown: {
      causes: causeScore.score,
      scopeLocation: scopeLocationScore.score,
      helpMethod: helpMethodScore.score,
      profileQuality: profileQualityScore,
    },
    whyThisMatch,
    explanationBullets: buildExplanationBullets(
      organization,
      causeScore.matchedLabels,
      scopeLocationScore.hasLocationMatch,
      scopeLocationScore.matchedScopeLabel,
      helpMethodScore.matchedMethods,
      profileQualityScore > 0,
    ),
    matchedSignals,
  };
}

function scoreScopeAndLocationWithState(
  organization: OrganizationDoc,
  preferences: UserPreferences,
  sessionLocationState?: string,
) {
  let score = 0;
  let matchedScopeLabel: string | undefined;
  let hasLocationMatch = false;

  const scopeConfig = preferences.changeScope
    ? SCOPE_CONFIG[preferences.changeScope]
    : undefined;

  if (scopeConfig && organization.geographicFocus) {
    if (scopeConfig.exact.includes(organization.geographicFocus)) {
      score += 12;
      matchedScopeLabel = scopeConfig.label;
    } else if (scopeConfig.adjacent.includes(organization.geographicFocus)) {
      score += 8;
      matchedScopeLabel = scopeConfig.label;
    }
  }

  if (sessionLocationState) {
    const organizationState = normalizeState(organization.state);
    if (organizationState && organizationState === sessionLocationState) {
      score += 12;
      hasLocationMatch = true;
    }
  }

  return {
    score: Math.min(score, 25),
    matchedScopeLabel,
    hasLocationMatch,
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
