/**
 * Constants for batch processing.
 */

export const DEFAULT_BATCH_SIZE = 20;
export const DEFAULT_MODEL = "gpt-5.4-nano";

/**
 * JSON Schema for WebsiteConfirmation response format.
 * This matches the WebsiteConfirmationSchema from @cause/types.
 */
export const WEBSITE_CONFIRMATION_SCHEMA = {
  type: "object",
  properties: {
    hasCorrectWebsite: {
      type: "boolean",
      description:
        "Whether the model determined the provided URL is the correct website",
    },
    correctWebsiteUrl: {
      type: ["string", "null"],
      description: "The correct website URL if found, otherwise null",
    },
    reasoning: {
      type: "string",
      description:
        "Explanation of how the correct website was identified or why none matched",
    },
    organizationOneSentenceSummary: {
      type: ["string", "null"],
      description: "A brief summary of the organization",
    },
    whySupportOrganization: {
      type: ["string", "null"],
      description: "Why one should consider supporting the organization",
    },
    organizationMission: {
      type: ["string", "null"],
      description: "The mission statement of the organization",
    },
    organizationTagline: {
      type: ["string", "null"],
      description: "A tagline or slogan of the organization",
    },
    organizationUniqueTrait: {
      type: ["string", "null"],
      description: "What makes the organization unique",
    },
    organizationTargetAudience: {
      type: ["string", "null"],
      description: "The primary audience the organization serves",
    },
    organizationGeographicFocus: {
      type: ["string", "null"],
      enum: ["Global", "National", "Regional", "Local", null],
      description: "Geographic focus: Global/Regional/National/Local",
    },
    organizationActivities: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["name", "description"],
        additionalProperties: false,
      },
      description: "Key organizational activities (name and description)",
    },
    organizationKeywords: {
      type: ["array", "null"],
      items: { type: "string" },
      description:
        "Key words or labels that give quick insight into what the organization does",
    },
  },
  required: [
    "hasCorrectWebsite",
    "correctWebsiteUrl",
    "reasoning",
    "organizationOneSentenceSummary",
    "whySupportOrganization",
    "organizationMission",
    "organizationTagline",
    "organizationUniqueTrait",
    "organizationTargetAudience",
    "organizationGeographicFocus",
    "organizationActivities",
    "organizationKeywords",
  ],
  additionalProperties: false,
};
