import { TaxExemptOrganization, WebsiteConfirmationSchema } from "../types";
import { zodResponseFormat } from "../utils/openAiUtils";
import { findTaxExemptOrgs } from "../services/mongo";
import fs from "fs";
import path from "path";

const DEFAULT_BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 20;
const DEFAULT_BATCH_DIR = "data/batch";

interface WriteConfirmationFileOptions {
    batchDir?: string;
    batchSize?: number;
    organizations?: TaxExemptOrganization[];
}

export const writeConfirmationFile = async (options: WriteConfirmationFileOptions = {}) => {
    const {
        batchDir = process.env.BATCH_DIR || DEFAULT_BATCH_DIR,
        batchSize = DEFAULT_BATCH_SIZE,
        organizations,
    } = options;

    // If organizations aren't provided, fetch them
    const orgs: TaxExemptOrganization[] =
        organizations ||
        (await findTaxExemptOrgs(batchSize, {
            searchResults: { $exists: true, $not: { $size: 0 } },
            resultsParsedAt: { $exists: true },
            aiConfirmationResponse: { $exists: false },
        }));

    const today = new Date().toISOString();
    const alphanumericDate = today.replace(/[^0-9a-zA-Z]/g, "");

    // Ensure the output directory exists
    const outputDir = path.join(batchDir, "batchInput", "unprocessed");
    fs.mkdirSync(outputDir, { recursive: true });

    const outputFile = path.join(outputDir, `batch_${alphanumericDate}_${batchSize}.jsonl`);

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
                model: "gpt-5-nano",
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
                response_format: zodResponseFormat(WebsiteConfirmationSchema, "website-confirmation"),
            },
        };
        fs.appendFileSync(outputFile, JSON.stringify(line) + "\n");
    });

    return outputFile;
};

// Only run main if this is the main module
if (require.main === module) {
    writeConfirmationFile()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("Error:", error);
            process.exit(1);
        });
}
