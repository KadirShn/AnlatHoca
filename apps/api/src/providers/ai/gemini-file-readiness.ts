export const GEMINI_ORIGIN = "https://generativelanguage.googleapis.com";

const FILE_READY_TIMEOUT_MS = 35_000;
const FILE_POLL_INTERVAL_MS = 4_000;

export type GeminiFetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type GeminiFileReadinessErrorKind =
  | "authentication"
  | "document-expired"
  | "file-processing-failed"
  | "invalid-response"
  | "network"
  | "timeout"
  | "upstream";

export class GeminiFileReadinessError extends Error {
  constructor(
    readonly kind: GeminiFileReadinessErrorKind,
    cause?: unknown,
  ) {
    super("Gemini file readiness check failed.", { cause });
    this.name = "GeminiFileReadinessError";
  }
}

interface GeminiFileInput {
  providerFileName: string;
  providerFileUri: string;
  mimeType: "application/pdf";
}

export async function waitUntilGeminiFileIsActive(
  input: GeminiFileInput,
  apiKey: string,
  fetchImplementation: GeminiFetchImplementation,
): Promise<string> {
  if (
    !/^files\/[A-Za-z0-9_-]+$/.test(input.providerFileName) ||
    !isGeminiUri(input.providerFileUri)
  ) {
    throw new GeminiFileReadinessError("invalid-response");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FILE_READY_TIMEOUT_MS);

  try {
    while (!controller.signal.aborted) {
      const response = await fetchImplementation(
        `${GEMINI_ORIGIN}/v1beta/${input.providerFileName}`,
        {
          headers: { "X-Goog-Api-Key": apiKey },
          signal: controller.signal,
        },
      );

      if (response.status === 404) {
        throw new GeminiFileReadinessError("document-expired");
      }

      if (!response.ok) {
        throw new GeminiFileReadinessError(
          response.status === 401 || response.status === 403
            ? "authentication"
            : "upstream",
        );
      }

      const body: unknown = await response.json().catch((error) => {
        throw new GeminiFileReadinessError("invalid-response", error);
      });
      const file = parseFileState(body, input);

      if (file.state === "ACTIVE") {
        return file.uri;
      }

      if (file.state === "FAILED") {
        throw new GeminiFileReadinessError("file-processing-failed");
      }

      await waitForPoll(controller.signal);
    }

    throw new GeminiFileReadinessError("timeout");
  } catch (error) {
    if (error instanceof GeminiFileReadinessError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new GeminiFileReadinessError("timeout", error);
    }

    throw new GeminiFileReadinessError("network", error);
  } finally {
    clearTimeout(timeout);
  }
}

function parseFileState(
  value: unknown,
  expected: GeminiFileInput,
): { state: "PROCESSING" | "ACTIVE" | "FAILED"; uri: string } {
  if (
    !isRecord(value) ||
    value.name !== expected.providerFileName ||
    value.mimeType !== expected.mimeType ||
    typeof value.uri !== "string" ||
    !isGeminiUri(value.uri) ||
    (value.state !== "PROCESSING" &&
      value.state !== "ACTIVE" &&
      value.state !== "FAILED")
  ) {
    throw new GeminiFileReadinessError("invalid-response");
  }

  return { state: value.state, uri: value.uri };
}

function waitForPoll(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, FILE_POLL_INTERVAL_MS);
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

function isGeminiUri(value: string): boolean {
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
