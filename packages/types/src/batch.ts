/**
 * Type definitions for AI batch processing responses.
 */

/**
 * Activity object returned by AI confirmation.
 */
export interface AiActivity {
  name: string;
  description: string;
}

/**
 * Geographic focus enum values.
 */
export type GeographicFocusType = "Global" | "National" | "Regional" | "Local";

/**
 * Response structure from AI website confirmation.
 */
export interface AiConfirmationResponse {
  hasCorrectWebsite: boolean;
  correctWebsiteUrl: string | null;
  reasoning: string;
  organizationOneSentenceSummary: string | null;
  whySupportOrganization: string | null;
  organizationMission: string | null;
  organizationTagline: string | null;
  organizationUniqueTrait: string | null;
  organizationTargetAudience: string | null;
  organizationGeographicFocus: GeographicFocusType | null;
  organizationActivities: AiActivity[] | null;
  organizationKeywords: string[] | null;
}

/**
 * Response line from OpenAI batch processing.
 */
export interface BatchResponseLine {
  custom_id: string;
  error?: {
    message: string;
    code?: string;
  };
  response?: {
    body?: {
      model?: string;
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
  };
}
