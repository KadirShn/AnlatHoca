/** Safe, public application metadata. Never add secrets to this package. */
export const APP_NAME = "Anlat Hoca" as const;

/** Mobile PDF selection policy. These UX limits are not a security boundary. */
export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_PDF_SIZE_MEGABYTES = MAX_PDF_SIZE_BYTES / (1024 * 1024);
export const PDF_SIZE_LIMIT_LABEL =
  `Maksimum ${MAX_PDF_SIZE_MEGABYTES} MB` as const;
export const SUPPORTED_PDF_MIME_TYPES = ["application/pdf"] as const;
export const SUPPORTED_PDF_EXTENSIONS = [".pdf"] as const;
export const PDF_UPLOAD_MULTIPART_OVERHEAD_BYTES = 64 * 1024;
export const MAX_PDF_UPLOAD_BODY_BYTES =
  MAX_PDF_SIZE_BYTES + PDF_UPLOAD_MULTIPART_OVERHEAD_BYTES;
export const DOCUMENT_UPLOAD_TIMEOUT_MS = 120_000;
export const DOCUMENT_ANALYSIS_TIMEOUT_MS = 120_000;
export const LESSON_GENERATION_TIMEOUT_MS = 120_000;
