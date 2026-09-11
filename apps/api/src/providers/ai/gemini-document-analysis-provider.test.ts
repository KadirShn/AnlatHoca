import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GeminiDocumentAnalysisProvider } from "./gemini-document-analysis-provider";
import { DocumentAnalysisProviderError } from "./document-analysis-provider";

describe("GeminiDocumentAnalysisProvider", () => {
  it("classifies an aborted generation request as a timeout", async () => {
    let callCount = 0;
    const fetchImplementation: typeof fetch = async (_input, init) => {
      callCount += 1;

      if (callCount === 1) {
        return Response.json({
          name: "files/document",
          uri: "https://generativelanguage.googleapis.com/v1beta/files/document",
          mimeType: "application/pdf",
          state: "ACTIVE",
        });
      }

      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    };
    const provider = new GeminiDocumentAnalysisProvider(
      "test-key",
      "test-model",
      fetchImplementation,
      1,
    );

    await assert.rejects(
      provider.analyzeDocument({
        providerFileName: "files/document",
        providerFileUri:
          "https://generativelanguage.googleapis.com/v1beta/files/document",
        mimeType: "application/pdf",
        prompt: "Test prompt",
      }),
      (error: unknown) =>
        error instanceof DocumentAnalysisProviderError &&
        error.kind === "timeout",
    );
  });
});
