import {
  sanitizeTagline,
  type GeographicFocusType,
  type WebsiteConfirmation,
} from "@cause/lib";
import {
  processCrawlDataForConfirmedWebsite,
  type CrawlItemData,
  type SocialMediaUrls,
} from "./batchResponseProcessing";

export type AiConfirmationOutputs = {
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

export type AiConfirmationOrgUpdates = {
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
  enrichmentStage: "ready" | "ai_confirmed" | "local_ai_reviewed";
};

/**
 * Converts a validated AI confirmation into the provenance payload and
 * organization patch used by either the OpenAI or local Ollama workflow.
 */
export function buildAiConfirmationApplication(args: {
  confirmation: WebsiteConfirmation;
  crawlResults: CrawlItemData[];
  fallbackStage: "ai_confirmed" | "local_ai_reviewed";
}): {
  outputs: AiConfirmationOutputs;
  updates: AiConfirmationOrgUpdates;
} {
  const { confirmation, crawlResults, fallbackStage } = args;
  const confirmedWebsiteUrl = confirmation.hasCorrectWebsite
    ? confirmation.correctWebsiteUrl
    : null;
  const hasConfirmedWebsite = Boolean(confirmedWebsiteUrl);

  const outputs: AiConfirmationOutputs = {
    hasCorrectWebsite: confirmation.hasCorrectWebsite,
    correctWebsiteUrl: confirmedWebsiteUrl ?? undefined,
    mission: hasConfirmedWebsite
      ? (confirmation.organizationMission ?? undefined)
      : undefined,
    tagline: hasConfirmedWebsite
      ? sanitizeTagline(confirmation.organizationTagline)
      : undefined,
    oneSentenceSummary: hasConfirmedWebsite
      ? (confirmation.organizationOneSentenceSummary ?? undefined)
      : undefined,
    whySupport: hasConfirmedWebsite
      ? (confirmation.whySupportOrganization ?? undefined)
      : undefined,
    targetAudience: hasConfirmedWebsite
      ? (confirmation.organizationTargetAudience ?? undefined)
      : undefined,
    geographicFocus: hasConfirmedWebsite
      ? (confirmation.organizationGeographicFocus ?? undefined)
      : undefined,
    activityTags: hasConfirmedWebsite
      ? (confirmation.organizationActivities ?? undefined)
      : undefined,
    keywords: hasConfirmedWebsite
      ? (confirmation.organizationKeywords ?? undefined)
      : undefined,
    reasoning: confirmation.reasoning ?? undefined,
  };

  if (!confirmedWebsiteUrl) {
    return {
      outputs,
      updates: { enrichmentStage: fallbackStage },
    };
  }

  const crawlExtractedData = processCrawlDataForConfirmedWebsite(
    crawlResults,
    confirmedWebsiteUrl,
  );
  const socialMediaUrls =
    Object.keys(crawlExtractedData.socialMediaUrls).length > 0
      ? crawlExtractedData.socialMediaUrls
      : undefined;

  return {
    outputs,
    updates: {
      websiteUrl: confirmedWebsiteUrl,
      mission: confirmation.organizationMission ?? undefined,
      tagline: sanitizeTagline(confirmation.organizationTagline),
      oneSentenceSummary:
        confirmation.organizationOneSentenceSummary ?? undefined,
      whySupport: confirmation.whySupportOrganization ?? undefined,
      targetAudience: confirmation.organizationTargetAudience ?? undefined,
      geographicFocus: confirmation.organizationGeographicFocus ?? undefined,
      activities: confirmation.organizationActivities ?? undefined,
      keywords: confirmation.organizationKeywords ?? undefined,
      socialMediaUrls,
      donationUrl: crawlExtractedData.donationUrl,
      logoUrl: crawlExtractedData.logoUrl,
      emailAddresses:
        crawlExtractedData.emailAddresses.length > 0
          ? crawlExtractedData.emailAddresses
          : undefined,
      enrichmentStage: "ready",
    },
  };
}
