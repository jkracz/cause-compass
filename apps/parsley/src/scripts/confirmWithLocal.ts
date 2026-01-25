import { z } from "zod";
import axios from "axios";
import {
  TaxExemptOrganization,
  OllamaChatResponse,
  OllamaGenerateResponse,
} from "@cause/types";
import {
  connectToDatabase,
  disconnectFromDatabase,
  findTaxExemptOrgs,
} from "../services/mongo";
import { logger } from "../utils/logger";

// Configuration
const BATCH_SIZE = 1;
const OLLAMA_API_URL_CHAT = "http://localhost:11434/api/chat";
const OLLAMA_API_URL_GENERATE = "http://localhost:11434/api/generate";
const MODEL_NAME = "gemma3:27b";

// Define the response schema similar to the one in generateBatchConfirmationFile
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

/**
 * Processes a batch of organizations using the local Ollama API
 */
async function processOrgsWithLocalLLM() {
  try {
    // Connect to the database
    await connectToDatabase();
    logger.info("Connected to database");

    // Find organizations that need confirmation
    const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(BATCH_SIZE, {
      searchResults: { $exists: true },
      resultsParsedAt: { $exists: true },
      // aiConfirmationResponse: { $exists: false },
    });

    logger.info(`Found ${orgs.length} organizations to process`);

    // Process each organization
    const results = [];
    for (const org of orgs) {
      try {
        const result = await processOrganization(org);
        results.push({
          ein: org.ein,
          name: org.name,
          result,
        });

        // Small delay to avoid overwhelming local Ollama server
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: unknown) {
        logger.error(
          `Error processing organization ${org.ein}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    // Log summary
    logger.info(
      `Processed ${results.length} organizations using local Ollama model`,
    );

    // Output a sample result for review
    if (results.length > 0) {
      logger.info("Sample result:", JSON.stringify(results[0], null, 2));
    }

    return results;
  } catch (error: unknown) {
    logger.error(
      "Error in processOrgsWithLocalLLM:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  } finally {
    await disconnectFromDatabase();
  }
}

/**
 * Process a single organization using the Ollama API
 */
async function processOrganization(org: TaxExemptOrganization) {
  const {
    name,
    ein,
    street,
    city,
    state,
    nteeCode,
    activityCodes,
    confirmationCrawlItems,
  } = org;

  // Get the activity description from nteeCode or activityCodes
  let codeDescription = "";
  if (nteeCode) {
    codeDescription = nteeCode.description;
  } else if (activityCodes && activityCodes.length > 0) {
    codeDescription = activityCodes[0]?.description ?? "";
  }

  // Format webpage data from crawl items
  const websiteData =
    confirmationCrawlItems?.map((item) => ({
      title: item.title,
      url: item.url,
      textContent: item.textContent,
    })) ?? [];

  // System message for the LLM
  const systemMessage = `You are an expert at analyzing and interpreting webpage content. You will be given unstructured text from several webpages and information about a nonprofit organization. Some of these webpages may come from the same website. Your task is to determine the base URL of the correct website for the organization using all the provided information, and generate information like mission, unique traits, and reasons to support for the organization. If you cannot find the correct website, do not make up answers for the fields that are related to the website.
    
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
    
    - **Structured Response**: Your response must follow this exact JSON structure:
    {
      "hasCorrectWebsite": boolean, // true if a correct website is found, false otherwise
      "correctWebsiteUrl": string, // required if hasCorrectWebsite is true, the URL of the identified website
      "reasoning": string, // explanation of why this is or is not the correct website with specific evidence
      "organizationOneSentenceSummary": string, // a single sentence summary of the organization (optional)
      "whySupportOrganization": string, // reasons why someone might support this organization (optional)
      "organizationMission": string, // the organization's mission statement if found (optional)
      "organizationTagline": string, // a short tagline or slogan of the organization if found (optional)
      "organizationUniqueTrait": string, // what makes this organization unique (optional)
      "organizationTargetAudience": string, // who the organization primarily serves (optional)
      "organizationGeographicFocus": string, // must be one of: "Global", "Local", "National", "Regional" (optional)
      "organizationActivities": [ // array of activities the organization performs (at least one if website found)
        { 
          "name": string, // short name of the activity
          "description": string // brief description of the activity
        }
      ]
    }
    
    Your response should be ONLY the JSON object, with no additional text before or after.`;

  // User message with organization and webpage data
  const userMessage = `ORGANIZATION INFORMATION:
    name: ${name},
    EIN: ${ein},
    street: ${street},
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
    `,
      )
      .join(" ")}`;

  // First try using the chat API endpoint
  try {
    logger.info(`Calling Ollama chat API for ${ein} - ${name}`);

    const response = await axios.post<OllamaChatResponse>(OLLAMA_API_URL_CHAT, {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      stream: false,
      format: "json", // Request JSON formatted response
    });

    // Extract and validate the response
    if (
      response.data &&
      response.data.message &&
      response.data.message.content
    ) {
      try {
        // Try to parse the response as JSON
        const jsonResponse = JSON.parse(response.data.message.content);

        // Validate against our schema
        const validationResult = WebsiteConfirmation.safeParse(jsonResponse);
        if (validationResult.success) {
          return {
            success: true,
            data: validationResult.data,
            metadata: {
              model: response.data.model,
              total_duration: response.data.total_duration,
              eval_count: response.data.eval_count,
              api: "chat",
            },
          };
        } else {
          return {
            success: false,
            error: "Validation failed",
            validationErrors: validationResult.error.format(),
            rawResponse: response.data.message.content,
            api: "chat",
          };
        }
      } catch (parseError: unknown) {
        logger.warn(
          `JSON parse error with chat API, falling back to generate API: ${
            parseError instanceof Error
              ? parseError.message
              : String(parseError)
          }`,
        );
        // Fall through to the generate API fallback
      }
    } else {
      logger.warn(
        "Invalid response from Ollama chat API, falling back to generate API",
      );
      // Fall through to the generate API fallback
    }
  } catch (error: unknown) {
    logger.warn(
      `Error calling Ollama chat API, falling back to generate API: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    // Fall through to the generate API fallback
  }

  // Fallback to the generate API endpoint
  try {
    logger.info(`Calling Ollama generate API for ${ein} - ${name}`);

    // Combine system and user messages into a single prompt for generate API
    const prompt = `${systemMessage}\n\n${userMessage}`;

    const response = await axios.post<OllamaGenerateResponse>(
      OLLAMA_API_URL_GENERATE,
      {
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        format: "json",
      },
    );
    console.log("response_______________________", response);

    // Extract and validate the response
    if (response.data && response.data.response) {
      try {
        // Try to parse the response as JSON
        const jsonResponse = JSON.parse(response.data.response);

        // Validate against our schema
        const validationResult = WebsiteConfirmation.safeParse(jsonResponse);
        if (validationResult.success) {
          return {
            success: true,
            data: validationResult.data,
            metadata: {
              model: response.data.model,
              total_duration: response.data.total_duration,
              eval_count: response.data.eval_count,
              api: "generate",
            },
          };
        } else {
          return {
            success: false,
            error: "Validation failed",
            validationErrors: validationResult.error.format(),
            rawResponse: response.data.response,
            api: "generate",
          };
        }
      } catch (parseError: unknown) {
        return {
          success: false,
          error: "JSON parse error",
          parseError:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
          rawResponse: response.data.response,
          api: "generate",
        };
      }
    } else {
      return {
        success: false,
        error: "Invalid response from Ollama API",
        rawResponse: response.data,
        api: "generate",
      };
    }
  } catch (error: unknown) {
    logger.error(
      `Error calling Ollama API: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  processOrgsWithLocalLLM()
    .then(() => {
      logger.info("Script completed successfully");
      process.exit(0);
    })
    .catch((error: unknown) => {
      logger.error(
        "Script failed:",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    });
}

export { processOrgsWithLocalLLM };
