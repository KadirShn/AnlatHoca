import {
  MAX_TEACHER_ANSWER_CHARS,
} from "@anlat-hoca/config";
import { z } from "zod";

const boundedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

export const generatedTeacherAnswerSchema = z
  .object({
    answer: boundedText(1, MAX_TEACHER_ANSWER_CHARS),
    relatedSectionIndexes: z
      .array(z.number().int().nonnegative())
      .max(3),
    suggestedFollowUps: z.array(boundedText(1, 180)).max(3),
  })
  .strict();

export type GeneratedTeacherAnswer = z.infer<
  typeof generatedTeacherAnswerSchema
>;

export interface TeacherAnswerProvider {
  readonly model: string;
  generateAnswer(input: { prompt: string }): Promise<GeneratedTeacherAnswer>;
}

export type TeacherAnswerProviderErrorKind =
  | "authentication"
  | "invalid-response"
  | "network"
  | "safety"
  | "timeout"
  | "upstream";

export class TeacherAnswerProviderError extends Error {
  constructor(
    readonly kind: TeacherAnswerProviderErrorKind,
    cause?: unknown,
  ) {
    super("Teacher answer provider request failed.", { cause });
    this.name = "TeacherAnswerProviderError";
  }
}
