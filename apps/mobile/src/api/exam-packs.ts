import {
  examPackCatalogResponseSchema,
  examPackDetailResponseSchema,
  examPackIdSchema,
  examSubjectInsightsResponseSchema,
  type ExamPackCatalogResponse,
  type ExamPackDetailResponse,
  type ExamSubjectInsightsResponse,
} from "@anlat-hoca/contracts";

import { requestJson } from "./client";

export function getExamPacks(): Promise<ExamPackCatalogResponse> {
  return requestJson("/exam-packs", examPackCatalogResponseSchema);
}

export function getExamPackDetail(
  packId: string,
): Promise<ExamPackDetailResponse> {
  const validatedPackId = examPackIdSchema.parse(packId);

  return requestJson(
    `/exam-packs/${encodeURIComponent(validatedPackId)}`,
    examPackDetailResponseSchema,
  );
}

export function getExamSubjectInsights(
  packId: string,
  subjectId: string,
): Promise<ExamSubjectInsightsResponse> {
  const validatedPackId = examPackIdSchema.parse(packId);
  const validatedSubjectId = examPackIdSchema.parse(subjectId);

  return requestJson(
    `/exam-packs/${encodeURIComponent(validatedPackId)}/subjects/${encodeURIComponent(validatedSubjectId)}/insights`,
    examSubjectInsightsResponseSchema,
  );
}
