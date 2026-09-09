import {
  examPackCatalogResponseSchema,
  examPackDetailResponseSchema,
  type ExamPackCatalogResponse,
  type ExamPackDetailResponse,
  type ExamSubjectInsightsResponse,
} from "@anlat-hoca/contracts";
import {
  EXAM_PACKS,
  findExamPack,
  findExamSubjectHistoricalInsights,
} from "@anlat-hoca/config";

export class ExamPackNotFoundError extends Error {
  constructor() {
    super("Exam pack not found.");
    this.name = "ExamPackNotFoundError";
  }
}

export class ExamSubjectNotFoundError extends Error {
  constructor() {
    super("Exam subject not found.");
    this.name = "ExamSubjectNotFoundError";
  }
}

export class ExamInsightsNotAvailableError extends Error {
  constructor() {
    super("Verified exam insights are not available.");
    this.name = "ExamInsightsNotAvailableError";
  }
}

export function listExamPacks(): ExamPackCatalogResponse {
  return examPackCatalogResponseSchema.parse({
    packs: EXAM_PACKS.map((pack) => ({
      id: pack.id,
      title: pack.title,
      shortTitle: pack.shortTitle,
      description: pack.description,
      contentVersion: pack.contentVersion,
      subjectCount: pack.subjects.length,
    })),
  });
}

export function getExamPackDetail(packId: string): ExamPackDetailResponse {
  const pack = findExamPack(packId);

  if (!pack) {
    throw new ExamPackNotFoundError();
  }

  return examPackDetailResponseSchema.parse({
    pack: {
      id: pack.id,
      title: pack.title,
      shortTitle: pack.shortTitle,
      description: pack.description,
      audience: pack.audience,
      contentVersion: pack.contentVersion,
      subjects: pack.subjects,
    },
  });
}

export function getExamSubjectInsights(
  packId: string,
  subjectId: string,
): ExamSubjectInsightsResponse {
  const pack = findExamPack(packId);

  if (!pack) {
    throw new ExamPackNotFoundError();
  }
  if (!pack.subjects.some((subject) => subject.id === subjectId)) {
    throw new ExamSubjectNotFoundError();
  }

  const insights = findExamSubjectHistoricalInsights(packId, subjectId);

  if (!insights) {
    throw new ExamInsightsNotAvailableError();
  }

  return insights;
}
