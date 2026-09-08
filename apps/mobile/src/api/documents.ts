import {
  apiErrorResponseSchema,
  documentUploadResponseSchema,
  type DocumentUploadResponse,
} from "@anlat-hoca/contracts";
import { DOCUMENT_UPLOAD_TIMEOUT_MS } from "@anlat-hoca/config";
import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";

import { getApiConfiguration } from "@/config/api";
import type { SelectedDocument } from "@/services/documents";

import { ApiClientError } from "./api-error";

interface UploadDocumentInput {
  installationId: string;
  document: SelectedDocument;
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

  const localFile = new File(document.uri);
  const formData = new FormData();
  formData.append("installationId", installationId);
  formData.append(
    "file",
    localFile.slice(0, localFile.size, "application/pdf"),
    document.name,
  );

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DOCUMENT_UPLOAD_TIMEOUT_MS);

  try {
    const response = await expoFetch(
      `${configuration.baseUrl}/documents/upload`,
      {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
        signal: controller.signal,
      },
    );
    const body: unknown = await response.json().catch((error) => {
      throw new ApiClientError("API yanıtı geçerli JSON değil.", {
        kind: "invalidResponse",
        status: response.status,
        cause: error,
      });
    });

    if (!response.ok) {
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
  }
}
