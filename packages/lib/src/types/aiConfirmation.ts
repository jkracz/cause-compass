import * as z from "zod";

import { ActivitySchema } from "./activity";

export const GeographicFocusSchema = z.enum([
  "Global",
  "Local",
  "National",
  "Regional",
]);
export type GeographicFocusType = z.infer<typeof GeographicFocusSchema>;

export const WebsiteConfirmationSchema = z.object({
  hasCorrectWebsite: z
    .boolean()
    .describe(
      "Whether the model determined the provided URL is the correct website",
    ),
  correctWebsiteUrl: z
    .string()
    .nullable()
    .describe("The correct website URL if found, otherwise null"),
  reasoning: z
    .string()
    .describe(
      "Explanation of how the correct website was identified or why none matched",
    ),
  organizationOneSentenceSummary: z
    .string()
    .nullable()
    .describe("A brief summary of the organization"),
  whySupportOrganization: z
    .string()
    .nullable()
    .describe("Why one should consider supporting the organization"),
  organizationMission: z
    .string()
    .nullable()
    .describe("The mission statement of the organization"),
  organizationTagline: z
    .string()
    .nullable()
    .describe(
      "A real tagline or slogan of the organization. Use null if none is present; never return punctuation, separators, placeholders, or empty text.",
    ),
  organizationUniqueTrait: z
    .string()
    .nullable()
    .describe("What makes the organization unique"),
  organizationTargetAudience: z
    .string()
    .nullable()
    .describe("The primary audience the organization serves"),
  organizationGeographicFocus: GeographicFocusSchema.nullable().describe(
    "Geographic focus: Global/Regional/National/Local",
  ),
  organizationActivities: z
    .array(ActivitySchema)
    .nullable()
    .describe("Key organizational activities (name and description)"),
  organizationKeywords: z
    .array(z.string())
    .nullable()
    .describe(
      "Key words or labels that give quick insight into what the organization does, who they help, and how they help",
    ),
});
export type WebsiteConfirmation = z.infer<typeof WebsiteConfirmationSchema>;

export const WebsiteConfirmationPromptArgsSchema = z.object({
  ein: z.string(),
  name: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  codeDescription: z.string(),
  websiteData: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      textContent: z.string(),
    }),
  ),
});
export type WebsiteConfirmationPromptArgs = z.infer<
  typeof WebsiteConfirmationPromptArgsSchema
>;

/**
 * Builds the canonical website-confirmation chat prompt shared by batch OpenAI
 * processing and the local Ollama validation runner.
 */
export function buildWebsiteConfirmationMessages(
  args: WebsiteConfirmationPromptArgs,
) {
  const systemPrompt = `You are an expert at analyzing and interpreting webpage content. You will be given unstructured text from several webpages and information about a nonprofit organization. Some of these webpages may come from the same website. Your task is to determine the base URL of the correct website for the organization using all the provided information, and generate information like mission, unique traits, and reasons to support for the organization. If you cannot find the correct website, do not make up answers for the fields that are related to the website.

Key Guidelines:

- **Evidence-Based Analysis**: Confirm a webpage as the organization's correct website if there is clear evidence such as:
  - **Matching Organization Name**: Exact or very close matches, including recognized abbreviations or DBA ("doing business as") names.
  - **EIN or Exact Address**: Direct matches of EIN or full street address.
  - **Combination of Partial Matches**: Organization name along with matching city and state can be sufficient.

- **Consider Reasonable Variations**: Be aware that organizations may use acronyms, abbreviations, or alternative names.

- **Avoid Unfounded Assumptions**: Do not rely solely on activity code similarities, common terms, or indirect references without supporting evidence.

- **Cite Specific Evidence**: In your reasoning, mention the specific parts of the webpage content that provide evidence supporting your conclusion.

- **Balanced Judgment**: Use a balanced approach, considering all available evidence without being overly restrictive.

- **Accuracy Over Completeness**: If there's insufficient evidence after thorough analysis, it's acceptable to conclude that none of the provided webpages belong to the organization.

- **Structured Response**: Your response must follow the given structure and output format exactly.

Remember, your goal is to accurately identify the organization's correct website by carefully considering all relevant evidence.`;

  const userPrompt = `ORGANIZATION INFORMATION:
name: ${args.name},
EIN: ${args.ein},
street: ${args.street},
city: ${args.city},
state: ${args.state},
ntee code OR activity code description: ${args.codeDescription};

WEBPAGE CONTENT TO ANALYZE:
${args.websiteData
  .map(
    (item, index) => `{
Page ${index + 1}:
webpage url: ${item.url},
webpage title: ${item.title},
webpage text: ${item.textContent},
}
`,
  )
  .join(" ")}
`;

  return [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];
}
