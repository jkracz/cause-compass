/**
 * OpenAI Batch API helper for Convex actions.
 * Uses native fetch for simplicity in Convex runtime (similar to googleSearch.ts).
 */

// Type declaration for environment variables in Convex actions
declare const process: {
  env: Record<string, string | undefined>;
};

// ============================================================================
// Types
// ============================================================================

/**
 * OpenAI Batch status values
 */
export type OpenAIBatchStatus =
  | "validating"
  | "in_progress"
  | "finalizing"
  | "completed"
  | "failed"
  | "expired"
  | "cancelling"
  | "cancelled";

/**
 * OpenAI Batch object returned by the API
 */
export interface OpenAIBatch {
  id: string;
  object: "batch";
  endpoint: string;
  errors: {
    object: string;
    data: Array<{
      code: string;
      message: string;
      param: string | null;
      line: number | null;
    }>;
  } | null;
  input_file_id: string;
  completion_window: string;
  status: OpenAIBatchStatus;
  output_file_id: string | null;
  error_file_id: string | null;
  created_at: number;
  in_progress_at: number | null;
  expires_at: number | null;
  finalizing_at: number | null;
  completed_at: number | null;
  failed_at: number | null;
  expired_at: number | null;
  cancelling_at: number | null;
  cancelled_at: number | null;
  request_counts: {
    total: number;
    completed: number;
    failed: number;
  } | null;
  metadata: Record<string, string> | null;
}

/**
 * OpenAI File object returned by the API
 */
export interface OpenAIFile {
  id: string;
  object: "file";
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
  status: string;
  status_details?: string;
}

/**
 * Batch request line format for JSONL file
 */
export interface BatchRequestLine {
  custom_id: string;
  method: "POST";
  url: "/v1/chat/completions";
  body: {
    model: string;
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
    response_format?: {
      type: string;
      json_schema?: {
        name: string;
        strict: boolean;
        schema: Record<string, unknown>;
      };
    };
    max_tokens?: number;
    temperature?: number;
  };
}

/**
 * Batch response line format from output JSONL
 */
export interface BatchResponseLine {
  id: string;
  custom_id: string;
  response: {
    status_code: number;
    request_id: string;
    body: {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string;
        };
        finish_reason: string;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the OpenAI API key from environment variables.
 */
export function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return apiKey;
}

/**
 * Make an authenticated request to the OpenAI API.
 */
async function openAIRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const apiKey = getOpenAIApiKey();
  const baseUrl = "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Upload a JSONL file to OpenAI for batch processing.
 *
 * @param content - JSONL content as a string
 * @param filename - Name for the file (optional)
 * @returns The uploaded file object
 */
export async function uploadBatchFile(
  content: string,
  filename: string = "batch_input.jsonl",
): Promise<OpenAIFile> {
  const apiKey = getOpenAIApiKey();
  const baseUrl = "https://api.openai.com/v1";

  // Create a Blob from the content
  const blob = new Blob([content], { type: "application/jsonl" });

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append("purpose", "batch");
  formData.append("file", blob, filename);

  const response = await fetch(`${baseUrl}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI file upload error (${response.status}): ${errorText}`,
    );
  }

  return response.json() as Promise<OpenAIFile>;
}

/**
 * Download file content from OpenAI.
 *
 * @param fileId - The OpenAI file ID
 * @returns The file content as a string
 */
export async function downloadFileContent(fileId: string): Promise<string> {
  const apiKey = getOpenAIApiKey();
  const baseUrl = "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl}/files/${fileId}/content`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI file download error (${response.status}): ${errorText}`,
    );
  }

  return response.text();
}

/**
 * Get file metadata from OpenAI.
 *
 * @param fileId - The OpenAI file ID
 * @returns The file object
 */
export async function getFile(fileId: string): Promise<OpenAIFile> {
  return openAIRequest<OpenAIFile>(`/files/${fileId}`);
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Create a new batch job on OpenAI.
 *
 * @param inputFileId - The ID of the uploaded input file
 * @param metadata - Optional metadata to attach to the batch
 * @returns The created batch object
 */
export async function createBatch(
  inputFileId: string,
  metadata?: Record<string, string>,
): Promise<OpenAIBatch> {
  return openAIRequest<OpenAIBatch>("/batches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input_file_id: inputFileId,
      endpoint: "/v1/chat/completions",
      completion_window: "24h",
      metadata,
    }),
  });
}

/**
 * Retrieve the status of a batch job.
 *
 * @param batchId - The OpenAI batch ID
 * @returns The batch object with current status
 */
export async function getBatch(batchId: string): Promise<OpenAIBatch> {
  return openAIRequest<OpenAIBatch>(`/batches/${batchId}`);
}

/**
 * Cancel a batch job.
 *
 * @param batchId - The OpenAI batch ID
 * @returns The updated batch object
 */
export async function cancelBatch(batchId: string): Promise<OpenAIBatch> {
  return openAIRequest<OpenAIBatch>(`/batches/${batchId}/cancel`, {
    method: "POST",
  });
}

/**
 * List all batch jobs with pagination.
 *
 * @param limit - Maximum number of batches to return (default 20, max 100)
 * @param after - Cursor for pagination
 * @returns List of batch objects
 */
export async function listBatches(
  limit: number = 20,
  after?: string,
): Promise<{
  object: "list";
  data: OpenAIBatch[];
  first_id: string | null;
  last_id: string | null;
  has_more: boolean;
}> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (after) {
    params.set("after", after);
  }
  return openAIRequest(`/batches?${params.toString()}`);
}

// ============================================================================
// Batch Content Generation
// ============================================================================

/**
 * Generate a batch request line for website confirmation.
 * This follows the format used in generateBatchConfirmationFile.ts
 */
export function createConfirmationRequestLine(args: {
  ein: string;
  name: string;
  street: string;
  city: string;
  state: string;
  codeDescription: string;
  websiteData: Array<{
    title: string;
    url: string;
    textContent: string;
  }>;
  model?: string;
  responseSchema: Record<string, unknown>;
}): BatchRequestLine {
  const {
    ein,
    name,
    street,
    city,
    state,
    codeDescription,
    websiteData,
    model = "gpt-5.4-nano",
    responseSchema,
  } = args;

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
  .join(" ")}
`;

  return {
    custom_id: `${ein}_${new Date().toISOString()}`,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "website-confirmation",
          strict: true,
          schema: responseSchema,
        },
      },
    },
  };
}

/**
 * Convert an array of batch request lines to JSONL format.
 */
export function toJSONL(lines: BatchRequestLine[]): string {
  return lines.map((line) => JSON.stringify(line)).join("\n");
}

/**
 * Parse JSONL output content into batch response lines.
 */
export function parseJSONL(content: string): BatchResponseLine[] {
  return content
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as BatchResponseLine);
}

// ============================================================================
// Status Helpers
// ============================================================================

/**
 * Check if a batch is still processing (not in a terminal state).
 */
export function isBatchProcessing(status: OpenAIBatchStatus): boolean {
  return ["validating", "in_progress", "finalizing"].includes(status);
}

/**
 * Check if a batch completed successfully.
 */
export function isBatchCompleted(status: OpenAIBatchStatus): boolean {
  return status === "completed";
}

/**
 * Check if a batch failed or was cancelled.
 */
export function isBatchFailed(status: OpenAIBatchStatus): boolean {
  return ["failed", "expired", "cancelled"].includes(status);
}

/**
 * Map OpenAI batch status to internal batch job status.
 */
export function mapOpenAIStatusToJobStatus(
  status: OpenAIBatchStatus,
): "processing" | "downloading" | "failed" {
  if (isBatchCompleted(status)) {
    return "downloading";
  }
  if (isBatchFailed(status)) {
    return "failed";
  }
  return "processing";
}
