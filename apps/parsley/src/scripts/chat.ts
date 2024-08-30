import { openai } from "../utils/openAi";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { TaxExemptOrganization } from "../types";

const WebsiteConfirmation = z.object({
    isCorrectWebiste: z.boolean(),
    reasoning: z.string(),
});
export const confirmWebsite = async (
    webpageUrl: string,
    webpageTitle: string,
    webpageText: string,
    org: TaxExemptOrganization,
    socialMediaUrls: string[]
) => {
    const { name, ein, city, state, nteeCode, activityCodes } = org;
    let codeDescription = "";
    if (nteeCode) {
        codeDescription = nteeCode.description;
    } else if (activityCodes && activityCodes.length > 0) {
        codeDescription = activityCodes[0].description;
    }
    try {
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert at analyzing and interpreting a webpage's content. You will be given unstructured text from some webpages and some information about a nonprofit organization. Your task is to determine whether the webpage belongs to the organization and explain your reasoning for your decision, all within the given structure. Use all of the data at your disposal to make a thorough and accurate choice.",
                },
                {
                    role: "user",
                    content: `ORGANIZATION INFORMATION: 
                          name: ${name}, 
                          ein: ${ein}, 
                          city: ${city}, 
                          state: ${state}, 
                          ntee code OR activity code description: ${codeDescription};
                          
                          HOMEPAGE CONTENT: 
                          webpage url: ${webpageUrl},
                          webpage title: ${webpageTitle},
                          webpage text: ${webpageText},
                          social media links pulled from the webpage: ${socialMediaUrls.toString()};`,
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
            // Retry with a higher max tokens
            console.log("Too many tokens: ", e.message);
        } else {
            // Handle other exceptions
            console.log("An error occurred: ", e.message);
        }
    }
};
