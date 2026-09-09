import {
  generateQuizRequestSchema,
  generateQuizResponseSchema,
  lessonIdSchema,
  quizAttemptDetailRequestSchema,
  quizAttemptDetailResponseSchema,
  quizAttemptIdSchema,
  quizDetailRequestSchema,
  quizDetailResponseSchema,
  quizIdSchema,
  quizSubmissionRequestSchema,
  quizSubmissionResponseSchema,
  type GenerateQuizResponse,
  type QuizAttemptDetailResponse,
  type QuizSubmissionAnswer,
  type QuizSubmissionResponse,
} from "@anlat-hoca/contracts";
import { QUIZ_GENERATION_TIMEOUT_MS } from "@anlat-hoca/config";

import { requestJson } from "./client";

export function getOrCreateQuiz(input: {
  installationId: string;
  lessonId: string;
}): Promise<GenerateQuizResponse> {
  const lessonId = lessonIdSchema.parse(input.lessonId);
  const request = generateQuizRequestSchema.parse({
    installationId: input.installationId,
  });

  return requestJson(
    `/lessons/${lessonId}/quiz`,
    generateQuizResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    QUIZ_GENERATION_TIMEOUT_MS,
  );
}

export function getQuizDetail(input: {
  installationId: string;
  quizId: string;
}): Promise<GenerateQuizResponse> {
  const quizId = quizIdSchema.parse(input.quizId);
  const request = quizDetailRequestSchema.parse({
    installationId: input.installationId,
  });

  return requestJson(
    `/quizzes/${quizId}/detail`,
    quizDetailResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}

export function submitQuiz(input: {
  installationId: string;
  quizId: string;
  answers: QuizSubmissionAnswer[];
}): Promise<QuizSubmissionResponse> {
  const quizId = quizIdSchema.parse(input.quizId);
  const request = quizSubmissionRequestSchema.parse({
    installationId: input.installationId,
    answers: input.answers,
  });

  return requestJson(
    `/quizzes/${quizId}/submit`,
    quizSubmissionResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}

export function getQuizAttemptDetail(input: {
  installationId: string;
  attemptId: string;
}): Promise<QuizAttemptDetailResponse> {
  const attemptId = quizAttemptIdSchema.parse(input.attemptId);
  const request = quizAttemptDetailRequestSchema.parse({
    installationId: input.installationId,
  });

  return requestJson(
    `/quiz-attempts/${attemptId}/detail`,
    quizAttemptDetailResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}
