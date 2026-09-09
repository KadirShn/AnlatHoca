import {
  lessonDetailRequestSchema,
  lessonDetailResponseSchema,
  lessonGenerationRequestSchema,
  lessonGenerationResponseSchema,
  lessonIdSchema,
  documentIdSchema,
  type LessonDetailResponse,
  type LessonDuration,
  type LessonGenerationResponse,
} from "@anlat-hoca/contracts";
import { LESSON_GENERATION_TIMEOUT_MS } from "@anlat-hoca/config";

import { requestJson } from "./client";

interface GenerateLessonInput {
  installationId: string;
  documentId: string;
  durationMinutes: LessonDuration;
}

interface GetLessonDetailInput {
  installationId: string;
  lessonId: string;
}

export function generateLesson({
  installationId,
  documentId,
  durationMinutes,
}: GenerateLessonInput): Promise<LessonGenerationResponse> {
  const validDocumentId = documentIdSchema.parse(documentId);
  const request = lessonGenerationRequestSchema.parse({
    installationId,
    durationMinutes,
  });

  return requestJson(
    `/documents/${validDocumentId}/lessons`,
    lessonGenerationResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    LESSON_GENERATION_TIMEOUT_MS,
  );
}

export function getLessonDetail({
  installationId,
  lessonId,
}: GetLessonDetailInput): Promise<LessonDetailResponse> {
  const validLessonId = lessonIdSchema.parse(lessonId);
  const request = lessonDetailRequestSchema.parse({ installationId });

  return requestJson(
    `/lessons/${validLessonId}/detail`,
    lessonDetailResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}
