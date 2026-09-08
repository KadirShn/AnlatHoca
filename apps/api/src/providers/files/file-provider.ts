export interface UploadPdfInput {
  content: Blob;
  displayName: string;
  sizeBytes: number;
  mimeType: "application/pdf";
}

export interface UploadedProviderFile {
  provider: "gemini";
  fileName: string;
  fileUri: string;
  expiresAt?: string;
}

export interface TemporaryFileProvider {
  uploadPdf(input: UploadPdfInput): Promise<UploadedProviderFile>;
  deleteFile(providerFileName: string): Promise<void>;
}

export type FileProviderErrorKind =
  | "authentication"
  | "invalid-response"
  | "network"
  | "timeout"
  | "upstream";

export class FileProviderError extends Error {
  readonly kind: FileProviderErrorKind;

  constructor(kind: FileProviderErrorKind, cause?: unknown) {
    super("Temporary file provider request failed.", { cause });
    this.name = "FileProviderError";
    this.kind = kind;
  }
}
