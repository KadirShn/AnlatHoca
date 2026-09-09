import {
  generatedQuizSchema,
  QuizGenerationProviderError,
  type GeneratedQuiz,
  type QuizGenerationProvider,
  type QuizGenerationProviderInput,
} from "./quiz-generation-provider";
import {
  GEMINI_ORIGIN,
  type GeminiFetchImplementation,
} from "./gemini-file-readiness";
import { fetchGeminiWithTransientRetry } from "./gemini-transient-request";

const GENERATION_TIMEOUT_MS = 100_000;

export class GeminiQuizGenerationProvider
  implements QuizGenerationProvider
{
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly fetchImplementation: GeminiFetchImplementation = (
      input,
      init,
    ) => fetch(input, init),
  ) {}

  async generateQuiz(
    input: QuizGenerationProviderInput,
  ): Promise<GeneratedQuiz> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      const { response, attempts } = await fetchGeminiWithTransientRetry(
        this.fetchImplementation,
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
                parts: [{ text: input.prompt }],
              },
            ],
            generationConfig: {
              candidateCount: 1,
              maxOutputTokens: 8_192,
              responseJsonSchema: createGeminiQuizSchema(input.questionCount),
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
            event: "gemini_quiz_generation_request_failed",
            status: response.status,
            attempts,
          }),
        );
        throw new QuizGenerationProviderError(
          response.status === 401 || response.status === 403
            ? "authentication"
            : "upstream",
        );
      }

      if (attempts > 1) {
        console.log(
          JSON.stringify({
            event: "gemini_quiz_generation_request_recovered",
            attempts,
          }),
        );
      }

      const body: unknown = await response.json().catch((error) => {
        throw new QuizGenerationProviderError("invalid-response", error);
      });

      return parseGenerationResponse(body);
    } catch (error) {
      if (error instanceof QuizGenerationProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new QuizGenerationProviderError("timeout", error);
      }

      throw new QuizGenerationProviderError("network", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseGenerationResponse(value: unknown): GeneratedQuiz {
  if (!isRecord(value)) {
    throw new QuizGenerationProviderError("invalid-response");
  }

  const candidates = value.candidates;

  if (!Array.isArray(candidates) || candidates.length !== 1) {
    throw new QuizGenerationProviderError(
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
    throw new QuizGenerationProviderError(
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
    throw new QuizGenerationProviderError("invalid-response", error);
  }

  const result = generatedQuizSchema.safeParse(parsed);

  if (!result.success) {
    throw new QuizGenerationProviderError("invalid-response", result.error);
  }

  return result.data;
}

function createGeminiQuizSchema(questionCount: number) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      questions: {
        type: "array",
        minItems: questionCount,
        maxItems: questionCount,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            sourceSectionIndex: { type: "integer", minimum: 0 },
            question: { type: "string" },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: { type: "string" },
            },
            correctOptionIndex: {
              type: "integer",
              minimum: 0,
              maximum: 3,
            },
            explanation: { type: "string" },
          },
          required: [
            "sourceSectionIndex",
            "question",
            "options",
            "correctOptionIndex",
            "explanation",
          ],
        },
      },
    },
    required: ["title", "questions"],
  } as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
