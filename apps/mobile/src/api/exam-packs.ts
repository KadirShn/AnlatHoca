import {
  examPackCatalogResponseSchema,
  examPackDetailResponseSchema,
  examPackIdSchema,
  type ExamPackCatalogResponse,
  type ExamPackDetailResponse,
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
