import {
  FileProviderError,
  type TemporaryFileProvider,
  type UploadedProviderFile,
  type UploadPdfInput,
} from "./file-provider";

const GEMINI_ORIGIN = "https://generativelanguage.googleapis.com";
const GEMINI_FILES_UPLOAD_URL = `${GEMINI_ORIGIN}/upload/v1beta/files`;
const PROVIDER_TIMEOUT_MS = 90_000;
const DELETE_TIMEOUT_MS = 10_000;

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class GeminiFilesProvider implements TemporaryFileProvider {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {}

  async uploadPdf(input: UploadPdfInput): Promise<UploadedProviderFile> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

    try {
      const startResponse = await this.fetchImplementation(
        GEMINI_FILES_UPLOAD_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": input.sizeBytes.toString(),
            "X-Goog-Upload-Header-Content-Type": input.mimeType,
            "X-Goog-Upload-Protocol": "resumable",
          },
          body: JSON.stringify({
            file: { display_name: input.displayName },
          }),
          signal: controller.signal,
        },
      );

      if (!startResponse.ok) {
        throw responseError(startResponse);
      }

      const uploadUrl = validateUploadUrl(
        startResponse.headers.get("x-goog-upload-url"),
      );
      const uploadResponse = await this.fetchImplementation(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Length": input.sizeBytes.toString(),
          "Content-Type": input.mimeType,
          "X-Goog-Upload-Command": "upload, finalize",
          "X-Goog-Upload-Offset": "0",
        },
        body: input.content,
        signal: controller.signal,
      });

      if (!uploadResponse.ok) {
        throw responseError(uploadResponse);
      }

      const body: unknown = await uploadResponse.json().catch((error) => {
        throw new FileProviderError("invalid-response", error);
      });

      return parseUploadedFile(body, input);
    } catch (error) {
      if (error instanceof FileProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new FileProviderError("timeout", error);
      }

      throw new FileProviderError("network", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  async deleteFile(providerFileName: string): Promise<void> {
    if (!/^files\/[A-Za-z0-9_-]+$/.test(providerFileName)) {
      throw new FileProviderError("invalid-response");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELETE_TIMEOUT_MS);

    try {
      const response = await this.fetchImplementation(
        `${GEMINI_ORIGIN}/v1beta/${providerFileName}`,
        {
          method: "DELETE",
          headers: { "X-Goog-Api-Key": this.apiKey },
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw responseError(response);
      }
    } catch (error) {
      if (error instanceof FileProviderError) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new FileProviderError("timeout", error);
      }

      throw new FileProviderError("network", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function responseError(response: Response): FileProviderError {
  return new FileProviderError(
    response.status === 401 || response.status === 403
      ? "authentication"
      : "upstream",
  );
}

function validateUploadUrl(value: string | null): string {
  if (!value) {
    throw new FileProviderError("invalid-response");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch (error) {
    throw new FileProviderError("invalid-response", error);
  }

  if (url.protocol !== "https:" || url.origin !== GEMINI_ORIGIN) {
    throw new FileProviderError("invalid-response");
  }

  return url.toString();
}

function parseUploadedFile(
  value: unknown,
  input: UploadPdfInput,
): UploadedProviderFile {
  if (!isRecord(value) || !isRecord(value.file)) {
    throw new FileProviderError("invalid-response");
  }

  const file = value.file;

  if (
    typeof file.name !== "string" ||
    !/^files\/[A-Za-z0-9_-]+$/.test(file.name) ||
    typeof file.uri !== "string" ||
    !isGeminiFileUri(file.uri) ||
    file.mimeType !== input.mimeType ||
    file.sizeBytes !== input.sizeBytes.toString()
  ) {
    throw new FileProviderError("invalid-response");
  }

  if (
    file.expirationTime !== undefined &&
    (typeof file.expirationTime !== "string" ||
      Number.isNaN(Date.parse(file.expirationTime)))
  ) {
    throw new FileProviderError("invalid-response");
  }

  return {
    provider: "gemini",
    fileName: file.name,
    fileUri: file.uri,
    expiresAt: file.expirationTime,
  };
}

function isGeminiFileUri(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === GEMINI_ORIGIN;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
