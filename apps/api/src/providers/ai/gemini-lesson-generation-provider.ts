import { lessonContentSchema } from "@anlat-hoca/contracts";

import {
  GEMINI_ORIGIN,
  GeminiFileReadinessError,
  waitUntilGeminiFileIsActive,
  type GeminiFetchImplementation,
} from "./gemini-file-readiness";
import {
  LessonGenerationProviderError,
  type LessonGenerationProvider,
  type LessonGenerationProviderInput,
} from "./lesson-generation-provider";

const GENERATION_TIMEOUT_MS = 100_000;

export class GeminiLessonGenerationProvider
  implements LessonGenerationProvider
{
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly fetchImplementation: GeminiFetchImplementation = (
      input,
      init,
    ) => fetch(input, init),
  ) {}

  async generateLesson(
    input: LessonGenerationProviderInput,
  ): Promise<ReturnType<typeof lessonContentSchema.parse>> {
    let activeFileUri: string;

    try {
      activeFileUri = await waitUntilGeminiFileIsActive(
        input,
        this.apiKey,
        this.fetchImplementation,
      );
    } catch (error) {
      if (error instanceof GeminiFileReadinessError) {
        throw new LessonGenerationProviderError(error.kind, error);
      }

      throw error;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      const response = await this.fetchImplementation(
        `${GEMINI_ORIGIN}/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
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
              maxOutputTokens: 16_384,
              responseJsonSchema: GEMINI_LESSON_SCHEMA,
              responseMimeType: "application/json",
              temperature: 0.35,
            },
            store: false,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        console.error(
          JSON.stringify({
            event: "gemini_lesson_generation_request_failed",
            status: response.status,
          }),
        );
        throw new LessonGenerationProviderError(
          response.status === 401 || response.status === 403
            ? "authentication"
            : "upstream",
        );
      }

      const body: unknown = await response.json().catch((error) => {
        throw new LessonGenerationProviderError("invalid-response", error);
      });

      return parseGenerationResponse(body);
    } catch (error) {
      if (error instanceof LessonGenerationProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new LessonGenerationProviderError("timeout", error);
      }

      throw new LessonGenerationProviderError("network", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseGenerationResponse(
  value: unknown,
): ReturnType<typeof lessonContentSchema.parse> {
  if (!isRecord(value)) {
    throw new LessonGenerationProviderError("invalid-response");
  }

  const candidates = value.candidates;

  if (!Array.isArray(candidates) || candidates.length !== 1) {
    throw new LessonGenerationProviderError(
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
    throw new LessonGenerationProviderError(
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
    throw new LessonGenerationProviderError("invalid-response", error);
  }

  const result = lessonContentSchema.safeParse(parsed);

  if (!result.success) {
    throw new LessonGenerationProviderError(
      "invalid-response",
      result.error,
    );
  }

  return result.data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const GEMINI_LESSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "Süre odağını yansıtan, en fazla 160 karakterlik Türkçe ders başlığı.",
    },
    overview: {
      type: "string",
      description: "Dersin kapsamını açıklayan, en fazla 1000 karakterlik Türkçe giriş.",
    },
    learningObjectives: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" },
    },
    sections: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          estimatedMinutes: { type: "integer", minimum: 1, maximum: 30 },
          explanation: { type: "string" },
          keyPoints: {
            type: "array",
            minItems: 2,
            maxItems: 6,
            items: { type: "string" },
          },
          memoryTip: { type: "string" },
        },
        required: [
          "title",
          "estimatedMinutes",
          "explanation",
          "keyPoints",
        ],
      },
    },
    recap: {
      type: "array",
      minItems: 3,
      maxItems: 10,
      items: { type: "string" },
    },
    skippedTopics: {
      type: "array",
      maxItems: 10,
      items: { type: "string" },
    },
  },
  required: [
    "title",
    "overview",
    "learningObjectives",
    "sections",
    "recap",
    "skippedTopics",
  ],
} as const;
