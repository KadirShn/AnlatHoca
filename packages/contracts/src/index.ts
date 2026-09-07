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

export const apiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
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
