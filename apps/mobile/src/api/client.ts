import {
  apiErrorResponseSchema,
  apiHealthResponseSchema,
  guestSessionRequestSchema,
  guestSessionResponseSchema,
  type ApiHealthResponse,
  type GuestSessionRequest,
  type GuestSessionResponse,
} from "@anlat-hoca/contracts";

import { getApiConfiguration } from "@/config/api";

import { ApiClientError } from "./api-error";

const REQUEST_TIMEOUT_MS = 8_000;

interface RuntimeSchema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: unknown };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new ApiClientError("API yanıtı geçerli JSON değil.", {
      kind: "invalidResponse",
      status: response.status,
      cause: error,
    });
  }
}

async function requestJson<T>(
  path: string,
  schema: RuntimeSchema<T>,
  init?: RequestInit,
): Promise<T> {
  const configuration = getApiConfiguration();

  if (configuration.status !== "configured") {
    throw new ApiClientError("API adresi yapılandırılmamış.", {
      kind: "configuration",
    });
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${configuration.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
      signal: controller.signal,
    });
    const body = await readJson(response);

    if (!response.ok) {
      const apiError = apiErrorResponseSchema.safeParse(body);

      throw new ApiClientError("API isteği başarısız oldu.", {
        kind: "server",
        status: response.status,
        serverCode: apiError.success ? apiError.data.error.code : undefined,
      });
    }

    const result = schema.safeParse(body);

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
      throw new ApiClientError("API isteği zaman aşımına uğradı.", {
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

export function getHealth(): Promise<ApiHealthResponse> {
  return requestJson("/health", apiHealthResponseSchema);
}

export function bootstrapGuestSession(
  request: GuestSessionRequest,
): Promise<GuestSessionResponse> {
  const validatedRequest = guestSessionRequestSchema.parse(request);

  return requestJson("/session", guestSessionResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedRequest),
  });
}
