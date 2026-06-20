import {
  sanitizeTagline,
  type CodexResearchEvidenceString,
  type CodexResearchResult,
  type GeographicFocusType,
} from "@cause/lib";
import {
  extractSocialMediaUrls,
  type SocialMediaUrls,
} from "./batchResponseProcessing";

export type CodexResearchMode =
  | "dry_run"
  | "enqueue_crawl"
  | "promote_ready";

export type CodexResearchOutputs = {
  hasCorrectWebsite: boolean;
  correctWebsiteUrl?: string;
  mission?: string;
  tagline?: string;
  oneSentenceSummary?: string;
  whySupport?: string;
  targetAudience?: string;
  geographicFocus?: string;
  activityTags?: Array<{ name: string; description: string }>;
  keywords?: string[];
  reasoning?: string;
};

export type CodexResearchOrgUpdates = {
  websiteUrl?: string;
  mission?: string;
  tagline?: string;
  oneSentenceSummary?: string;
  whySupport?: string;
  targetAudience?: string;
  geographicFocus?: GeographicFocusType;
  activities?: Array<{ name: string; description: string }>;
  keywords?: string[];
  socialMediaUrls?: SocialMediaUrls;
  donationUrl?: string;
  logoUrl?: string;
  emailAddresses?: string[];
  enrichmentStage: "ready";
};

function nonEmptyString(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function evidenceValue(
  evidence: CodexResearchEvidenceString | null | undefined,
): string | undefined {
  return nonEmptyString(evidence?.value);
}

function httpUrl(value: string | null | undefined): string | undefined {
  const normalized = nonEmptyString(value);
  if (!normalized) {
    return undefined;
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

function cleanStringArray(values: string[] | null | undefined): string[] {
  if (!values) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) => nonEmptyString(value))
        .filter((value): value is string => value !== undefined),
    ),
  ];
}

function cleanEmails(values: string[] | null | undefined): string[] {
  return cleanStringArray(values)
    .map((value) => value.toLowerCase())
    .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

function buildReasoning(result: CodexResearchResult): string {
  const evidenceSummary = result.identityEvidence
    .slice(0, 3)
    .map(
      (item) =>
        `${item.sourceUrl}: ${nonEmptyString(item.quoteOrObservation) ?? "identity evidence observed"}`,
    )
    .join(" | ");
  const rejection = nonEmptyString(result.rejectionReason);
  const parts = [
    `Codex research confidence: ${result.websiteConfidence}.`,
    result.hasCorrectWebsite && result.correctWebsiteUrl
      ? `Official website: ${result.correctWebsiteUrl}.`
      : "No sufficiently evidenced official website.",
    evidenceSummary ? `Evidence: ${evidenceSummary}` : undefined,
    rejection ? `Rejection reason: ${rejection}` : undefined,
  ];

  return parts.filter(Boolean).join(" ").slice(0, 3000);
}

export function isPromotableCodexResearchResult(
  result: CodexResearchResult,
): boolean {
  const hasSummaryOrMission = Boolean(
    evidenceValue(result.profile.oneSentenceSummary) ??
      evidenceValue(result.profile.mission),
  );

  return (
    result.hasCorrectWebsite &&
    Boolean(httpUrl(result.correctWebsiteUrl)) &&
    result.websiteConfidence === "high" &&
    result.identityEvidence.length >= 2 &&
    hasSummaryOrMission
  );
}

export function buildCodexResearchOutputs(
  result: CodexResearchResult,
): CodexResearchOutputs {
  const confirmedWebsiteUrl = result.hasCorrectWebsite
    ? httpUrl(result.correctWebsiteUrl)
    : undefined;
  const hasConfirmedWebsite = Boolean(confirmedWebsiteUrl);

  return {
    hasCorrectWebsite: hasConfirmedWebsite,
    correctWebsiteUrl: confirmedWebsiteUrl,
    mission: hasConfirmedWebsite ? evidenceValue(result.profile.mission) : undefined,
    tagline: hasConfirmedWebsite
      ? sanitizeTagline(evidenceValue(result.profile.tagline))
      : undefined,
    oneSentenceSummary: hasConfirmedWebsite
      ? evidenceValue(result.profile.oneSentenceSummary)
      : undefined,
    whySupport: hasConfirmedWebsite
      ? evidenceValue(result.profile.whySupport)
      : undefined,
    targetAudience: hasConfirmedWebsite
      ? evidenceValue(result.profile.targetAudience)
      : undefined,
    geographicFocus: hasConfirmedWebsite
      ? result.profile.geographicFocus?.value
      : undefined,
    activityTags: hasConfirmedWebsite
      ? result.profile.activities?.map(({ name, description }) => ({
          name,
          description,
        })) ?? undefined
      : undefined,
    keywords: hasConfirmedWebsite
      ? cleanStringArray(result.profile.keywords?.value)
      : undefined,
    reasoning: buildReasoning(result),
  };
}

export function buildCodexResearchReadyUpdates(
  result: CodexResearchResult,
): CodexResearchOrgUpdates | null {
  if (!isPromotableCodexResearchResult(result)) {
    return null;
  }

  const socialValues = Object.values(result.extractedLinks.socialMediaUrls ?? {})
    .map((item) => (item ? httpUrl(item.value) : undefined))
    .filter((value): value is string => value !== undefined);
  const socialMediaUrls = extractSocialMediaUrls(socialValues);
  const emails = cleanEmails(result.extractedLinks.emailAddresses?.value);
  const keywords = cleanStringArray(result.profile.keywords?.value);
  const activities =
    result.profile.activities?.map(({ name, description }) => ({
      name,
      description,
    })) ?? [];

  return {
    websiteUrl: httpUrl(result.correctWebsiteUrl),
    mission: evidenceValue(result.profile.mission),
    tagline: sanitizeTagline(evidenceValue(result.profile.tagline)),
    oneSentenceSummary: evidenceValue(result.profile.oneSentenceSummary),
    whySupport: evidenceValue(result.profile.whySupport),
    targetAudience: evidenceValue(result.profile.targetAudience),
    geographicFocus: result.profile.geographicFocus?.value,
    activities: activities.length > 0 ? activities : undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    socialMediaUrls:
      Object.keys(socialMediaUrls).length > 0 ? socialMediaUrls : undefined,
    donationUrl: httpUrl(result.extractedLinks.donationUrl?.value),
    logoUrl: httpUrl(result.extractedLinks.logoUrl?.value),
    emailAddresses: emails.length > 0 ? emails : undefined,
    enrichmentStage: "ready",
  };
}
