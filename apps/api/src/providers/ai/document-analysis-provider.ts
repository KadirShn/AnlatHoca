import type { DocumentAnalysis } from "@anlat-hoca/contracts";

export interface DocumentAnalysisProviderInput {
  providerFileName: string;
  providerFileUri: string;
  mimeType: "application/pdf";
  prompt: string;
}

export interface DocumentAnalysisProvider {
  readonly model: string;
  analyzeDocument(
    input: DocumentAnalysisProviderInput,
  ): Promise<DocumentAnalysis>;
}

export type DocumentAnalysisProviderErrorKind =
  | "authentication"
  | "document-expired"
  | "file-processing-failed"
  | "invalid-response"
  | "network"
  | "safety"
  | "timeout"
  | "upstream";

export class DocumentAnalysisProviderError extends Error {
  constructor(
    readonly kind: DocumentAnalysisProviderErrorKind,
    cause?: unknown,
  ) {
    super("Document analysis provider request failed.", { cause });
    this.name = "DocumentAnalysisProviderError";
  }
}
