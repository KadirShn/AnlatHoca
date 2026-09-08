import { documentAnalysisSchema } from "@anlat-hoca/contracts";

import {
  DocumentAnalysisProviderError,
  type DocumentAnalysisProvider,
  type DocumentAnalysisProviderInput,
} from "./document-analysis-provider";

const GEMINI_ORIGIN = "https://generativelanguage.googleapis.com";
const FILE_READY_TIMEOUT_MS = 35_000;
const FILE_POLL_INTERVAL_MS = 4_000;
const GENERATION_TIMEOUT_MS = 75_000;

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class GeminiDocumentAnalysisProvider
  implements DocumentAnalysisProvider
{
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {}

  async analyzeDocument(
    input: DocumentAnalysisProviderInput,
  ): Promise<ReturnType<typeof documentAnalysisSchema.parse>> {
    const activeFileUri = await this.waitUntilFileIsActive(input);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      GENERATION_TIMEOUT_MS,
    );

    try {
      const response = await this.fetchImplementation(
        GEMINI_ORIGIN +
          "/v1beta/models/" +
          encodeURIComponent(this.model) +
          ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    fileData: {
                      mimeType: input.mimeType,
                      fileUri: activeFileUri,
                    },
                  },
                  { text: input.prompt },
                ],
              },
            ],
            generationConfig: {
              candidateCount: 1,
              maxOutputTokens: 8_192,
              responseJsonSchema: GEMINI_DOCUMENT_ANALYSIS_SCHEMA,
              responseMimeType: "application/json",
              temperature: 0.2,
            },
            store: false,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw responseError(response);
      }

      const body: unknown = await response.json().catch((error) => {
        throw new DocumentAnalysisProviderError(
          "invalid-response",
          error,
        );
      });

      return parseGenerationResponse(body);
    } catch (error) {
      if (error instanceof DocumentAnalysisProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new DocumentAnalysisProviderError("timeout", error);
      }

      throw new DocumentAnalysisProviderError("network", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async waitUntilFileIsActive(
    input: DocumentAnalysisProviderInput,
  ): Promise<string> {
    if (
      !/^files\/[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(
        input.providerFileName,
      ) ||
      !isGeminiUri(input.providerFileUri)
    ) {
      throw new DocumentAnalysisProviderError("invalid-response");
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      FILE_READY_TIMEOUT_MS,
    );

    try {
      while (!controller.signal.aborted) {
        const response = await this.fetchImplementation(
          GEMINI_ORIGIN + "/v1beta/" + input.providerFileName,
          {
            headers: { "X-Goog-Api-Key": this.apiKey },
            signal: controller.signal,
          },
        );

        if (response.status === 404) {
          throw new DocumentAnalysisProviderError("document-expired");
        }

        if (!response.ok) {
          throw responseError(response);
        }

        const body: unknown = await response.json().catch((error) => {
          throw new DocumentAnalysisProviderError(
            "invalid-response",
            error,
          );
        });
        const file = parseFileState(body, input);

        if (file.state === "ACTIVE") {
          return file.uri;
        }

        if (file.state === "FAILED") {
          throw new DocumentAnalysisProviderError(
            "file-processing-failed",
          );
        }

        await waitForPoll(controller.signal);
      }

      throw new DocumentAnalysisProviderError("timeout");
    } catch (error) {
      if (error instanceof DocumentAnalysisProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new DocumentAnalysisProviderError("timeout", error);
      }

      throw new DocumentAnalysisProviderError("network", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function responseError(response: Response): DocumentAnalysisProviderError {
  return new DocumentAnalysisProviderError(
    response.status === 401 || response.status === 403
      ? "authentication"
      : "upstream",
  );
}

function parseFileState(
  value: unknown,
  expected: DocumentAnalysisProviderInput,
): { state: "PROCESSING" | "ACTIVE" | "FAILED"; uri: string } {
  if (
    !isRecord(value) ||
    value.name !== expected.providerFileName ||
    value.mimeType !== expected.mimeType ||
    typeof value.uri !== "string" ||
    !isGeminiUri(value.uri) ||
    (value.state !== "PROCESSING" &&
      value.state !== "ACTIVE" &&
      value.state !== "FAILED")
  ) {
    throw new DocumentAnalysisProviderError("invalid-response");
  }

  return { state: value.state, uri: value.uri };
}

function parseGenerationResponse(
  value: unknown,
): ReturnType<typeof documentAnalysisSchema.parse> {
  if (!isRecord(value)) {
    throw new DocumentAnalysisProviderError("invalid-response");
  }

  const candidates = value.candidates;

  if (!Array.isArray(candidates) || candidates.length !== 1) {
    throw new DocumentAnalysisProviderError(
      isRecord(value.promptFeedback) &&
        typeof value.promptFeedback.blockReason === "string"
        ? "safety"
        : "invalid-response",
    );
  }

  const candidate = candidates[0];

  if (
    !isRecord(candidate) ||
    candidate.finishReason !== "STOP" ||
    !isRecord(candidate.content) ||
    !Array.isArray(candidate.content.parts) ||
    candidate.content.parts.length !== 1 ||
    !isRecord(candidate.content.parts[0]) ||
    typeof candidate.content.parts[0].text !== "string"
  ) {
    throw new DocumentAnalysisProviderError(
      isRecord(candidate) &&
        typeof candidate.finishReason === "string" &&
        candidate.finishReason !== "MAX_TOKENS"
        ? "safety"
        : "invalid-response",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(candidate.content.parts[0].text);
  } catch (error) {
    throw new DocumentAnalysisProviderError("invalid-response", error);
  }

  const result = documentAnalysisSchema.safeParse(parsed);

  if (!result.success) {
    throw new DocumentAnalysisProviderError(
      "invalid-response",
      result.error,
    );
  }

  return result.data;
}

function waitForPoll(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, FILE_POLL_INTERVAL_MS);
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function isGeminiUri(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === GEMINI_ORIGIN;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const GEMINI_DOCUMENT_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "Belgenin Türkçe başlığı; en fazla 160 karakter.",
    },
    summary: {
      type: "string",
      description: "Belgenin kısa Türkçe özeti; en fazla 1200 karakter.",
    },
    topics: {
      type: "array",
      minItems: 1,
      maxItems: 25,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            description: "Konunun kısa Türkçe başlığı.",
          },
          summary: {
            type: "string",
            description: "Konunun kısa, kaynakla sınırlı Türkçe özeti.",
          },
          importance: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "Konunun yalnızca bu belge içindeki merkeziliği.",
          },
          difficulty: {
            type: "integer",
            minimum: 1,
            maximum: 5,
            description: "Konunun kavramsal zorluğu.",
          },
          keyPoints: {
            type: "array",
            minItems: 2,
            maxItems: 6,
            items: { type: "string" },
          },
        },
        required: [
          "title",
          "summary",
          "importance",
          "difficulty",
          "keyPoints",
        ],
      },
    },
  },
  required: ["title", "summary", "topics"],
} as const;
