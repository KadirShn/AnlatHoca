import { documentAnalysisSchema } from "@anlat-hoca/contracts";

import {
  DocumentAnalysisProviderError,
  type DocumentAnalysisProvider,
  type DocumentAnalysisProviderInput,
} from "./document-analysis-provider";
import {
  GEMINI_ORIGIN,
  GeminiFileReadinessError,
  waitUntilGeminiFileIsActive,
  type GeminiFetchImplementation,
} from "./gemini-file-readiness";

const GENERATION_TIMEOUT_MS = 150_000;

export class GeminiDocumentAnalysisProvider
  implements DocumentAnalysisProvider
{
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly fetchImplementation: GeminiFetchImplementation = (
      input,
      init,
    ) => fetch(input, init),
    private readonly generationTimeoutMs = GENERATION_TIMEOUT_MS,
  ) {}

  async analyzeDocument(
    input: DocumentAnalysisProviderInput,
  ): Promise<ReturnType<typeof documentAnalysisSchema.parse>> {
    let activeFileUri: string;

    try {
      activeFileUri = await waitUntilGeminiFileIsActive(
        input,
        this.apiKey,
        this.fetchImplementation,
      );
    } catch (error) {
      if (error instanceof GeminiFileReadinessError) {
        throw new DocumentAnalysisProviderError(error.kind, error);
      }

      throw error;
    }
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.generationTimeoutMs,
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

}

function responseError(response: Response): DocumentAnalysisProviderError {
  return new DocumentAnalysisProviderError(
    response.status === 401 || response.status === 403
      ? "authentication"
      : "upstream",
  );
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
