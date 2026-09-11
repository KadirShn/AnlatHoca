import {
  analyzeDocumentRequestSchema,
  analyzeDocumentResponseSchema,
  apiErrorResponseSchema,
  documentIdSchema,
  documentUploadResponseSchema,
  type AnalyzeDocumentResponse,
  type DocumentUploadResponse,
} from "@anlat-hoca/contracts";
import {
  DOCUMENT_ANALYSIS_TIMEOUT_MS,
  DOCUMENT_UPLOAD_TIMEOUT_MS,
} from "@anlat-hoca/config";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths, UploadType } from "expo-file-system";

import { getApiConfiguration } from "@/config/api";
import type { SelectedDocument } from "@/services/documents";

import { ApiClientError } from "./api-error";
import { requestJson } from "./client";

interface UploadDocumentInput {
  installationId: string;
  document: SelectedDocument;
}

interface AnalyzeDocumentInput {
  installationId: string;
  documentId: string;
}

export async function uploadDocument({
  installationId,
  document,
}: UploadDocumentInput): Promise<DocumentUploadResponse> {
  const configuration = getApiConfiguration();

  if (configuration.status !== "configured") {
    throw new ApiClientError("API adresi yapılandırılmamış.", {
      kind: "configuration",
    });
  }

  const controller = new AbortController();
  const uploadDirectory = new Directory(
    Paths.cache,
    "document-uploads",
    Crypto.randomUUID(),
  );
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DOCUMENT_UPLOAD_TIMEOUT_MS);

  try {
    uploadDirectory.create({ intermediates: true });
    const uploadFile = new File(
      uploadDirectory,
      sanitizeUploadFilename(document.name),
    );
    await new File(document.uri).copy(uploadFile);

    const response = await uploadFile.upload(
      `${configuration.baseUrl}/documents/upload`,
      {
        httpMethod: "POST",
        uploadType: UploadType.MULTIPART,
        fieldName: "file",
        mimeType: "application/pdf",
        parameters: { installationId },
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
    let body: unknown;

    try {
      body = JSON.parse(response.body);
    } catch (error) {
      throw new ApiClientError("API yanıtı geçerli JSON değil.", {
        kind: "invalidResponse",
        status: response.status,
        cause: error,
      });
    }

    if (response.status < 200 || response.status >= 300) {
      const apiError = apiErrorResponseSchema.safeParse(body);

      throw new ApiClientError("Belge yükleme isteği başarısız oldu.", {
        kind: "server",
        status: response.status,
        serverCode: apiError.success ? apiError.data.error.code : undefined,
      });
    }

    const result = documentUploadResponseSchema.safeParse(body);

    if (!result.success) {
      throw new ApiClientError("API yanıtı beklenen biçimde değil.", {
        kind: "invalidResponse",
        status: response.status,
      });
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (timedOut) {
      throw new ApiClientError("Belge yükleme isteği zaman aşımına uğradı.", {
        kind: "timeout",
        cause: error,
      });
    }

    throw new ApiClientError("API bağlantısı kurulamadı.", {
      kind: "network",
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
    cleanupUploadDirectory(uploadDirectory);
  }
}

function sanitizeUploadFilename(value: string): string {
  const sanitized = value
    .replace(/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return [...sanitized].slice(0, 180).join("") || "document.pdf";
}

function cleanupUploadDirectory(directory: Directory): void {
  try {
    if (directory.exists) {
      directory.delete();
    }
  } catch {
    console.warn(JSON.stringify({ event: "upload_temp_cleanup_failed" }));
  }
}

export function analyzeDocument({
  installationId,
  documentId,
}: AnalyzeDocumentInput): Promise<AnalyzeDocumentResponse> {
  const validatedDocumentId = documentIdSchema.parse(documentId);
  const request = analyzeDocumentRequestSchema.parse({ installationId });

  return requestJson(
    "/documents/" + validatedDocumentId + "/analyze",
    analyzeDocumentResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    DOCUMENT_ANALYSIS_TIMEOUT_MS,
  );
}

export function getDocumentAnalysis({
  installationId,
  documentId,
}: AnalyzeDocumentInput): Promise<AnalyzeDocumentResponse> {
  const validatedDocumentId = documentIdSchema.parse(documentId);
  const request = analyzeDocumentRequestSchema.parse({ installationId });

  return requestJson(
    "/documents/" + validatedDocumentId + "/analysis",
    analyzeDocumentResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
    DOCUMENT_ANALYSIS_TIMEOUT_MS,
  );
}
