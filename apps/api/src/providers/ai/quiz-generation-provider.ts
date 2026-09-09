import { z } from "zod";

const boundedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

export const generatedQuizQuestionSchema = z
  .object({
    sourceSectionIndex: z.number().int().nonnegative(),
    question: boundedText(10, 500),
    options: z.tuple([
      boundedText(1, 240),
      boundedText(1, 240),
      boundedText(1, 240),
      boundedText(1, 240),
    ]),
    correctOptionIndex: z.number().int().min(0).max(3),
    explanation: boundedText(20, 700),
  })
  .strict();

export const generatedQuizSchema = z
  .object({
    title: boundedText(1, 120),
    questions: z.array(generatedQuizQuestionSchema).min(1).max(10),
  })
  .strict();

export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;

export interface QuizGenerationProviderInput {
  prompt: string;
  questionCount: number;
}

export interface QuizGenerationProvider {
  readonly model: string;
  generateQuiz(input: QuizGenerationProviderInput): Promise<GeneratedQuiz>;
}

export type QuizGenerationProviderErrorKind =
  | "authentication"
  | "invalid-response"
  | "network"
  | "safety"
  | "timeout"
  | "upstream";

export class QuizGenerationProviderError extends Error {
  constructor(
    readonly kind: QuizGenerationProviderErrorKind,
    cause?: unknown,
  ) {
    super("Quiz generation provider request failed.", { cause });
    this.name = "QuizGenerationProviderError";
  }
}
