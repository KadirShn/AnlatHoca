import {
  generatedTeacherAnswerSchema,
  TeacherAnswerProviderError,
  type GeneratedTeacherAnswer,
  type TeacherAnswerProvider,
} from "./teacher-answer-provider";
import {
  GEMINI_ORIGIN,
  type GeminiFetchImplementation,
} from "./gemini-file-readiness";
import { fetchGeminiWithTransientRetry } from "./gemini-transient-request";

const GENERATION_TIMEOUT_MS = 100_000;

export class GeminiTeacherAnswerProvider implements TeacherAnswerProvider {
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly fetchImplementation: GeminiFetchImplementation = (
      input,
      init,
    ) => fetch(input, init),
  ) {}

  async generateAnswer(input: {
    prompt: string;
  }): Promise<GeneratedTeacherAnswer> {
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
            contents: [{ role: "user", parts: [{ text: input.prompt }] }],
            generationConfig: {
              candidateCount: 1,
              maxOutputTokens: 4_096,
              responseJsonSchema: createGeminiTeacherAnswerSchema(),
              responseMimeType: "application/json",
              temperature: 0.3,
            },
            store: false,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        console.error(
          JSON.stringify({
            event: "gemini_teacher_answer_request_failed",
            status: response.status,
            attempts,
          }),
        );
        throw new TeacherAnswerProviderError(
          response.status === 401 || response.status === 403
            ? "authentication"
            : "upstream",
        );
      }

      if (attempts > 1) {
        console.log(
          JSON.stringify({
            event: "gemini_teacher_answer_request_recovered",
            attempts,
          }),
        );
      }

      const body: unknown = await response.json().catch((error) => {
        throw new TeacherAnswerProviderError("invalid-response", error);
      });

      return parseGenerationResponse(body);
    } catch (error) {
      if (error instanceof TeacherAnswerProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new TeacherAnswerProviderError("timeout", error);
      }

      throw new TeacherAnswerProviderError("network", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseGenerationResponse(value: unknown): GeneratedTeacherAnswer {
  if (!isRecord(value)) {
    throw new TeacherAnswerProviderError("invalid-response");
  }

  const candidates = value.candidates;

  if (!Array.isArray(candidates) || candidates.length !== 1) {
    throw new TeacherAnswerProviderError(
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
    throw new TeacherAnswerProviderError(
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
    throw new TeacherAnswerProviderError("invalid-response", error);
  }

  const result = generatedTeacherAnswerSchema.safeParse(parsed);

  if (!result.success) {
    throw new TeacherAnswerProviderError("invalid-response", result.error);
  }

  return result.data;
}

function createGeminiTeacherAnswerSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      answer: { type: "string" },
      relatedSectionIndexes: {
        type: "array",
        minItems: 0,
        maxItems: 3,
        items: { type: "integer", minimum: 0 },
      },
      suggestedFollowUps: {
        type: "array",
        minItems: 0,
        maxItems: 3,
        items: { type: "string" },
      },
    },
    required: ["answer", "relatedSectionIndexes", "suggestedFollowUps"],
  } as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
