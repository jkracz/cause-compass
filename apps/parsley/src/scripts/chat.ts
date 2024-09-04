import { openai } from "../utils/openAi";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { TaxExemptOrganization, CrawlItem } from "../types";

const WebsiteConfirmation = z.object({
    hasCorrectWebsite: z.boolean(),
    correctWebsiteUrl: z.string().optional(),
    reasoning: z.string(),
});
export const confirmWebsite = async (crawlItems: CrawlItem[], org: TaxExemptOrganization) => {
    const { name, ein, city, state, nteeCode, activityCodes } = org;

    let codeDescription = "";
    if (nteeCode) {
        codeDescription = nteeCode.description;
    } else if (activityCodes && activityCodes.length > 0) {
        codeDescription = activityCodes[0].description;
    }

    const websiteData = crawlItems.map((item) => ({
        title: item.title,
        url: item.url,
        textContent: item.textContent,
    }));

    try {
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert at analyzing and interpreting webpage content. You will be given unstructured text from several webpages and information about a nonprofit organization. Some of these webpages may come from the same website. Your task is to determine the base URL of the correct website for the organization using all the provided information. You must explain your reasoning for your decision, following the given structure. It is possible that none of the provided webpages belong to the correct website, and you should indicate that if so.",
                },
                {
                    role: "user",
                    content: `ORGANIZATION INFORMATION: 
                          name: ${name}, 
                          ein: ${ein}, 
                          city: ${city}, 
                          state: ${state}, 
                          ntee code OR activity code description: ${codeDescription};
                          
                          WEBPAGE CONTENT TO ANALYZE: 
                          ${websiteData
                              .map(
                                  (item, index) => `{
                          Page ${index + 1}: 
                          webpage url: ${item.url}, 
                          webpage title: ${item.title}, 
                          webpage text: ${item.textContent}, 
                          }
                          `
                              )
                              .join("\n")}
                          `,
                },
            ],
            response_format: zodResponseFormat(WebsiteConfirmation, "website-confirmation"),
        });

        console.log("COMPLETION_CHOICES______", completion.choices[0]);
        const confirmationResponse = completion.choices[0].message;
        if (confirmationResponse.parsed) {
            console.log("CONFIRMATION_RESPONSE_PARSED______", confirmationResponse.parsed);
            // return confirmationResponse.parsed;
        } else if (confirmationResponse.refusal) {
            // handle refusal
            console.log("CONFIRMATION_RESPONSE_REFUSAL______", confirmationResponse.refusal);
        }
    } catch (e: any) {
        if (e.constructor.name == "LengthFinishReasonError") {
            console.log("Too many tokens: ", e.message);
        } else {
            console.log("An error occurred: ", e.message);
        }
    }
};
