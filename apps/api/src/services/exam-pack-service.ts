import {
  examPackCatalogResponseSchema,
  examPackDetailResponseSchema,
  type ExamPackCatalogResponse,
  type ExamPackDetailResponse,
} from "@anlat-hoca/contracts";
import { EXAM_PACKS, findExamPack } from "@anlat-hoca/config";

export class ExamPackNotFoundError extends Error {
  constructor() {
    super("Exam pack not found.");
    this.name = "ExamPackNotFoundError";
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
