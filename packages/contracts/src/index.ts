import { z } from "zod";

export const apiHealthResponseSchema = z
  .object({ status: z.literal("healthy") })
  .strict();

export type ApiHealthResponse = z.infer<typeof apiHealthResponseSchema>;

export const apiInfoResponseSchema = z
  .object({ name: z.literal("Anlat Hoca API"), status: z.literal("ok") })
  .strict();

export type ApiInfoResponse = z.infer<typeof apiInfoResponseSchema>;

export const installationIdSchema = z.string().uuid();

export const guestSessionRequestSchema = z
  .object({ installationId: installationIdSchema })
  .strict();

export type GuestSessionRequest = z.infer<typeof guestSessionRequestSchema>;

export const guestSessionResponseSchema = z
  .object({
    installationId: installationIdSchema,
    sessionType: z.literal("guest"),
    status: z.literal("ready"),
  })
  .strict();

export type GuestSessionResponse = z.infer<typeof guestSessionResponseSchema>;

export const documentIdSchema = z.string().uuid();

export const uploadedDocumentSchema = z
  .object({
    id: documentIdSchema,
    name: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    mimeType: z.literal("application/pdf"),
    status: z.literal("uploaded"),
  })
  .strict();

export type UploadedDocument = z.infer<typeof uploadedDocumentSchema>;

export const documentUploadResponseSchema = z
  .object({ document: uploadedDocumentSchema })
  .strict();

export type DocumentUploadResponse = z.infer<
  typeof documentUploadResponseSchema
>;

const boundedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

export const analysisTopicSchema = z
  .object({
    title: boundedText(1, 120),
    summary: boundedText(1, 500),
    importance: z.number().int().min(1).max(5),
    difficulty: z.number().int().min(1).max(5),
    keyPoints: z.array(boundedText(1, 240)).min(2).max(6),
  })
  .strict();

export type AnalysisTopic = z.infer<typeof analysisTopicSchema>;

export const documentAnalysisSchema = z
  .object({
    title: boundedText(1, 160),
    summary: boundedText(1, 1_200),
    topics: z.array(analysisTopicSchema).min(1).max(25),
  })
  .strict();

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

export const analyzeDocumentRequestSchema = z
  .object({ installationId: installationIdSchema })
  .strict();

export type AnalyzeDocumentRequest = z.infer<
  typeof analyzeDocumentRequestSchema
>;

export const analyzedDocumentSchema = z
  .object({
    id: documentIdSchema,
    status: z.literal("analyzed"),
  })
  .strict();

export const analyzeDocumentResponseSchema = z
  .object({
    document: analyzedDocumentSchema,
    analysis: documentAnalysisSchema,
  })
  .strict();

export type AnalyzeDocumentResponse = z.infer<
  typeof analyzeDocumentResponseSchema
>;

export const apiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_FILE",
  "AI_NOT_CONFIGURED",
  "UPSTREAM_ERROR",
  "DOCUMENT_NOT_FOUND",
  "DOCUMENT_EXPIRED",
  "ANALYSIS_NOT_FOUND",
  "ANALYSIS_FAILED",
  "ANALYSIS_IN_PROGRESS",
  "METHOD_NOT_ALLOWED",
  "NOT_FOUND",
  "INTERNAL_ERROR",
]);

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: apiErrorCodeSchema,
        message: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
