import {
  installationIdSchema,
  type ApiErrorResponse,
  type DocumentUploadResponse,
} from "@anlat-hoca/contracts";
import {
  MAX_PDF_SIZE_BYTES,
  MAX_PDF_SIZE_MEGABYTES,
  SUPPORTED_PDF_MIME_TYPES,
} from "@anlat-hoca/config";

import type { DocumentRepository } from "../data/document-repository";
import type { InstallationRepository } from "../data/installation-repository";
import {
  FileProviderError,
  type TemporaryFileProvider,
  type UploadedProviderFile,
} from "../providers/files/file-provider";

const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const GENERIC_BINARY_MIME_TYPE = "application/octet-stream";
const MAX_FILENAME_LENGTH = 180;

type UploadErrorCode = ApiErrorResponse["error"]["code"];
type UploadErrorStatus = 400 | 413 | 500 | 502 | 503;

export class DocumentUploadError extends Error {
  constructor(
    readonly code: UploadErrorCode,
    readonly status: UploadErrorStatus,
    readonly publicMessage: string,
    cause?: unknown,
  ) {
    super("Document upload failed.", { cause });
    this.name = "DocumentUploadError";
  }
}

interface UploadDocumentInput {
  installationId: string;
  file: File;
  installationRepository: InstallationRepository;
  documentRepository: DocumentRepository;
  fileProvider?: TemporaryFileProvider;
}

export async function uploadDocument(
  input: UploadDocumentInput,
): Promise<DocumentUploadResponse> {
  const installationIdResult = installationIdSchema.safeParse(
    input.installationId,
  );

  if (!installationIdResult.success) {
    throw new DocumentUploadError(
      "INVALID_REQUEST",
      400,
      "Geçersiz istek.",
    );
  }

  const validatedFile = await validatePdf(input.file);

  if (!input.fileProvider) {
    throw new DocumentUploadError(
      "AI_NOT_CONFIGURED",
      503,
      "Belge analiz servisi şu anda yapılandırılmamış.",
    );
  }

  try {
    await input.installationRepository.touch(installationIdResult.data);
  } catch (error) {
    throw new DocumentUploadError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      error,
    );
  }

  let providerFile: UploadedProviderFile;

  try {
    providerFile = await input.fileProvider.uploadPdf({
      content: input.file,
      displayName: validatedFile.name,
      sizeBytes: input.file.size,
      mimeType: "application/pdf",
    });
  } catch (error) {
    logProviderFailure(error);
    throw new DocumentUploadError(
      "UPSTREAM_ERROR",
      502,
      "Belge şu anda hazırlanamadı. Lütfen tekrar dene.",
      error,
    );
  }

  const documentId = crypto.randomUUID();

  try {
    await input.documentRepository.createUploadedDocument({
      id: documentId,
      installationId: installationIdResult.data,
      originalName: validatedFile.name,
      sizeBytes: input.file.size,
      mimeType: "application/pdf",
      provider: providerFile.provider,
      providerFileName: providerFile.fileName,
      providerFileUri: providerFile.fileUri,
      providerExpiresAt: providerFile.expiresAt,
      status: "uploaded",
    });
  } catch (error) {
    await cleanupProviderFile(input.fileProvider, providerFile.fileName);
    throw new DocumentUploadError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      error,
    );
  }

  return {
    document: {
      id: documentId,
      name: validatedFile.name,
      sizeBytes: input.file.size,
      mimeType: "application/pdf",
      status: "uploaded",
    },
  };
}

async function validatePdf(file: File): Promise<{ name: string }> {
  if (!Number.isSafeInteger(file.size) || file.size <= 0) {
    throw new DocumentUploadError(
      "INVALID_FILE",
      400,
      "Bu PDF kullanılamıyor. Lütfen başka bir dosya seç.",
    );
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new DocumentUploadError(
      "FILE_TOO_LARGE",
      413,
      `Bu dosya ${MAX_PDF_SIZE_MEGABYTES} MB sınırını aşıyor.`,
    );
  }

  const mimeType = file.type.trim().toLocaleLowerCase("en-US");

  if (
    !SUPPORTED_PDF_MIME_TYPES.includes(
      mimeType as (typeof SUPPORTED_PDF_MIME_TYPES)[number],
    ) &&
    mimeType !== GENERIC_BINARY_MIME_TYPE
  ) {
    throw new DocumentUploadError(
      "UNSUPPORTED_FILE_TYPE",
      400,
      "Şimdilik yalnızca PDF dosyaları destekleniyor.",
    );
  }

  const header = new Uint8Array(
    await file.slice(0, PDF_HEADER.length).arrayBuffer(),
  );

  if (
    header.length !== PDF_HEADER.length ||
    !PDF_HEADER.every((byte, index) => header[index] === byte)
  ) {
    throw new DocumentUploadError(
      "INVALID_FILE",
      400,
      "Bu PDF kullanılamıyor. Lütfen başka bir dosya seç.",
    );
  }

  const name = sanitizeFilename(file.name);

  if (!name) {
    throw new DocumentUploadError(
      "INVALID_FILE",
      400,
      "Bu PDF kullanılamıyor. Lütfen başka bir dosya seç.",
    );
  }

  return { name };
}

function sanitizeFilename(value: string): string {
  const withoutControls = value
    .replace(/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return [...withoutControls].slice(0, MAX_FILENAME_LENGTH).join("");
}

async function cleanupProviderFile(
  provider: TemporaryFileProvider,
  providerFileName: string,
): Promise<void> {
  try {
    await provider.deleteFile(providerFileName);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "provider_file_cleanup_failed",
        provider: "gemini",
        errorKind:
          error instanceof FileProviderError ? error.kind : "unknown",
      }),
    );
  }
}

function logProviderFailure(error: unknown): void {
  console.error(
    JSON.stringify({
      event: "provider_file_upload_failed",
      provider: "gemini",
      errorKind: error instanceof FileProviderError ? error.kind : "unknown",
    }),
  );
}
