import assert from "node:assert/strict";
import test from "node:test";

import type {
  LibraryDocumentSummary,
  LibraryLessonSummary,
} from "@anlat-hoca/contracts";

import type { LibraryRepository } from "../data/library-repository";
import { getLibrary } from "./library-service";

const installationId = "11111111-1111-4111-8111-111111111111";

test("library reads both bounded collections for one installation", async () => {
  const calls: Array<{ kind: string; installationId: string; limit: number }> = [];
  const repository: LibraryRepository = {
    async listLessons(scopedInstallationId, limit) {
      calls.push({ kind: "lessons", installationId: scopedInstallationId, limit });
      return [lesson];
    },
    async listDocuments(scopedInstallationId, limit) {
      calls.push({ kind: "documents", installationId: scopedInstallationId, limit });
      return [document];
    },
  };

  const result = await getLibrary(repository, {
    installationId,
    lessonLimit: 3,
    documentLimit: 20,
  });

  assert.deepEqual(calls, [
    { kind: "lessons", installationId, limit: 3 },
    { kind: "documents", installationId, limit: 20 },
  ]);
  assert.deepEqual(result, { lessons: [lesson], documents: [document] });
});

const lesson: LibraryLessonSummary = {
  id: "22222222-2222-4222-8222-222222222222",
  documentId: "33333333-3333-4333-8333-333333333333",
  title: "Örnek Ders",
  durationMinutes: 10,
  createdAt: "2026-09-09T10:00:00.000Z",
  document: { name: "notlar.pdf", analysisTitle: "Örnek Analiz" },
  quiz: {
    available: true,
    latestAttempt: {
      id: "44444444-4444-4444-8444-444444444444",
      scorePercent: 80,
    },
  },
  teacher: { threadExists: true, messageCount: 2 },
};

const document: LibraryDocumentSummary = {
  id: lesson.documentId,
  name: "notlar.pdf",
  status: "analyzed",
  createdAt: "2026-09-09T09:00:00.000Z",
  analysis: { title: "Örnek Analiz", topicCount: 1 },
  lessonCount: 1,
};
