import {
  lessonIdSchema,
  teacherMessageRequestSchema,
  teacherMessageResponseSchema,
  teacherThreadIdSchema,
  teacherThreadRequestSchema,
  teacherThreadResponseSchema,
  type TeacherMessageResponse,
  type TeacherThreadResponse,
} from "@anlat-hoca/contracts";
import { TEACHER_GENERATION_TIMEOUT_MS } from "@anlat-hoca/config";

import { requestJson } from "./client";

export function openTeacherThread(input: {
  installationId: string;
  lessonId: string;
}): Promise<TeacherThreadResponse> {
  const lessonId = lessonIdSchema.parse(input.lessonId);
  const request = teacherThreadRequestSchema.parse({
    installationId: input.installationId,
  });

  return requestJson(
    `/lessons/${lessonId}/teacher/thread`,
    teacherThreadResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}

export function getTeacherThreadDetail(input: {
  installationId: string;
  threadId: string;
}): Promise<TeacherThreadResponse> {
  const threadId = teacherThreadIdSchema.parse(input.threadId);
  const request = teacherThreadRequestSchema.parse({
    installationId: input.installationId,
  });

  return requestJson(
    `/teacher-threads/${threadId}/detail`,
    teacherThreadResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}

export function sendTeacherMessage(input: {
  installationId: string;
  lessonId: string;
  message: string;
}): Promise<TeacherMessageResponse> {
  const lessonId = lessonIdSchema.parse(input.lessonId);
  const request = teacherMessageRequestSchema.parse({
    installationId: input.installationId,
    message: input.message,
  });

  return requestJson(
    `/lessons/${lessonId}/teacher/messages`,
    teacherMessageResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    TEACHER_GENERATION_TIMEOUT_MS,
  );
}
