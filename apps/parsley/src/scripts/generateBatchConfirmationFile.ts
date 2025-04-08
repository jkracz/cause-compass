import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { TaxExemptOrganization } from "../types";
import { findTaxExemptOrgs } from "../db/mongo";
import fs from "fs";

const BATCH_SIZE = 1000;
const BATCH_DIR = "data/batch";

const Activity = z.object({
    name: z.string(),
    description: z.string(),
});

const GeographicFocus = z.enum(["Global", "Local", "National", "Regional"]);

const WebsiteConfirmation = z.object({
    hasCorrectWebsite: z.boolean(),
    correctWebsiteUrl: z.string().optional(),
    reasoning: z.string(),
    organizationOneSentenceSummary: z.string().optional(),
    whySupportOrganization: z.string().optional(),
    organizationMission: z.string().optional(),
    organizationTagline: z.string().optional(),
    organizationUniqueTrait: z.string().optional(),
    organizationTargetAudience: z.string().optional(),
    organizationGeographicFocus: GeographicFocus.optional(),
    organizationActivities: z.array(Activity),
});
export const writeConfirmationFile = async () => {
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(BATCH_SIZE, {
        searchResults: { $exists: true },
        resultsParsedAt: { $exists: true },
        aiConfirmationResponse: { $exists: false },
    });
    const today = new Date().toISOString();
    const alphanumericDate = today.replace(/[^0-9a-zA-Z]/g, "");

    orgs.forEach((org) => {
        const { name, ein, street, city, state, nteeCode, activityCodes, confirmationCrawlItems } = org;

        let codeDescription = "";
        if (nteeCode) {
            codeDescription = nteeCode.description;
        } else if (activityCodes && activityCodes.length > 0) {
            codeDescription = activityCodes[0].description;
        }

        const websiteData = confirmationCrawlItems?.map((item) => ({
            title: item.title,
            url: item.url,
            textContent: item.textContent,
        }));

        const line = {
            custom_id: `${ein}_${today}`,
            method: "POST",
            url: "/v1/chat/completions",
            body: {
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert at analyzing and interpreting webpage content. You will be given unstructured text from several webpages and information about a nonprofit organization. Some of these webpages may come from the same website. Your task is to determine the base URL of the correct website for the organization using all the provided information, and generate information like mission, unique traits, and reasons to support for the organizaiton. If you cannot find the correct website, do not make up answers for the fields that are related to the website.
                    
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
                    
                    Remember, your goal is to accurately identify the organization's correct website by carefully considering all relevant evidence.`,
                    },
                    {
                        role: "user",
                        content: `ORGANIZATION INFORMATION:
                    name: ${name},
                    EIN: ${ein},
                    street: ${street},
                    city: ${city},
                    state: ${state},
                    ntee code OR activity code description: ${codeDescription};
                    
                    WEBPAGE CONTENT TO ANALYZE:
                    ${websiteData
                        ?.map(
                            (item, index) => `{
                    Page ${index + 1}:
                    webpage url: ${item.url},
                    webpage title: ${item.title},
                    webpage text: ${item.textContent},
                    }
                    `
                        )
                        .join(" ")}
                    `,
                    },
                ],
                response_format: zodResponseFormat(WebsiteConfirmation, "website-confirmation"),
            },
        };
        fs.appendFileSync(
            `${BATCH_DIR}/batchInput/unprocessed/batch_${alphanumericDate}_${BATCH_SIZE}.jsonl`,
            JSON.stringify(line) + "\n"
        );
    });
};

const main = async () => {
    await writeConfirmationFile();
    process.exit(0);
};

main();
