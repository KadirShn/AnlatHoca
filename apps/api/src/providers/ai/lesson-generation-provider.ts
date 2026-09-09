import type { LessonContent } from "@anlat-hoca/contracts";

export interface LessonGenerationProviderInput {
  providerFileName: string;
  providerFileUri: string;
  mimeType: "application/pdf";
  prompt: string;
}

export interface LessonGenerationProvider {
  readonly model: string;
  generateLesson(
    input: LessonGenerationProviderInput,
  ): Promise<LessonContent>;
}

export type LessonGenerationProviderErrorKind =
  | "authentication"
  | "document-expired"
  | "file-processing-failed"
  | "invalid-response"
  | "network"
  | "safety"
  | "timeout"
  | "upstream";

export class LessonGenerationProviderError extends Error {
  constructor(
    readonly kind: LessonGenerationProviderErrorKind,
    cause?: unknown,
  ) {
    super("Lesson generation provider request failed.", { cause });
    this.name = "LessonGenerationProviderError";
  }
}
