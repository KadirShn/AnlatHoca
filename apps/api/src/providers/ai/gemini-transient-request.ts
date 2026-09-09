import type { GeminiFetchImplementation } from "./gemini-file-readiness";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 250;
const MAX_JITTER_MS = 100;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export interface GeminiRequestResult {
  response: Response;
  attempts: number;
}

export async function fetchGeminiWithTransientRetry(
  fetchImplementation: GeminiFetchImplementation,
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<GeminiRequestResult> {
  const signal = init.signal ?? undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchImplementation(input, init);

      if (
        !RETRYABLE_STATUS_CODES.has(response.status) ||
        attempt === MAX_ATTEMPTS
      ) {
        return { response, attempts: attempt };
      }

      await response.body?.cancel();
    } catch (error) {
      if (
        signal?.aborted ||
        !(error instanceof TypeError) ||
        attempt === MAX_ATTEMPTS
      ) {
        throw error;
      }
    }

    await waitForRetry(signal, retryDelayMs(attempt));
  }

  throw new Error("Gemini retry loop ended unexpectedly.");
}

function retryDelayMs(failedAttempt: number): number {
  const jitter = new Uint32Array(1);
  crypto.getRandomValues(jitter);

  return (
    BASE_DELAY_MS * 2 ** (failedAttempt - 1) +
    (jitter[0] ?? 0) % (MAX_JITTER_MS + 1)
  );
}

function waitForRetry(
  signal: AbortSignal | undefined,
  delayMs: number,
): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, delayMs);

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}
