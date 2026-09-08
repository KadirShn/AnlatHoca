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

export const apiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_FILE",
  "AI_NOT_CONFIGURED",
  "UPSTREAM_ERROR",
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
