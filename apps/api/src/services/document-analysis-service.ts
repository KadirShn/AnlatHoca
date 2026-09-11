import {
  analyzeDocumentResponseSchema,
  documentAnalysisSchema,
  documentIdSchema,
  installationIdSchema,
  type AnalyzeDocumentResponse,
  type ApiErrorResponse,
  type DocumentAnalysis,
} from "@anlat-hoca/contracts";
import {
  DOCUMENT_ANALYSIS_PROMPT,
  DOCUMENT_ANALYSIS_PROMPT_VERSION,
} from "@anlat-hoca/prompts";

import type {
  DocumentAnalysisRepository,
  StoredDocumentAnalysis,
} from "../data/document-analysis-repository";
import type {
  DocumentRecord,
  DocumentRepository,
} from "../data/document-repository";
import {
  DocumentAnalysisProviderError,
  type DocumentAnalysisProvider,
} from "../providers/ai/document-analysis-provider";

const DOCUMENT_ANALYSIS_SCHEMA_VERSION = "v1";
const ANALYSIS_LOCK_STALE_MS = 3 * 60 * 1_000;

type AnalysisErrorCode = ApiErrorResponse["error"]["code"];
type AnalysisErrorStatus = 400 | 404 | 409 | 410 | 422 | 500 | 502 | 503;

export class DocumentAnalysisError extends Error {
  constructor(
    readonly code: AnalysisErrorCode,
    readonly status: AnalysisErrorStatus,
    readonly publicMessage: string,
    cause?: unknown,
  ) {
    super("Document analysis failed.", { cause });
    this.name = "DocumentAnalysisError";
  }
}

interface DocumentAnalysisServiceInput {
  documentId: string;
  installationId: string;
  documentRepository: DocumentRepository;
  analysisRepository: DocumentAnalysisRepository;
  analysisProvider?: DocumentAnalysisProvider;
}

export async function analyzeDocument(
  input: DocumentAnalysisServiceInput,
): Promise<AnalyzeDocumentResponse> {
  const identifiers = validateIdentifiers(
    input.documentId,
    input.installationId,
  );
  const document = await findOwnedDocument(input, identifiers);
  const cached = await findValidatedAnalysis(
    input.analysisRepository,
    document.id,
  );

  if (cached) {
    return responseFor(document.id, cached);
  }

  assertDocumentCanBeAnalyzed(document);

  if (!input.analysisProvider) {
    throw new DocumentAnalysisError(
      "AI_NOT_CONFIGURED",
      503,
      "Belge analiz servisi şu anda yapılandırılmamış.",
    );
  }

  const staleBefore = new Date(
    Date.now() - ANALYSIS_LOCK_STALE_MS,
  ).toISOString();
  const claimed = await input.documentRepository.claimForAnalysis(
    document.id,
    identifiers.installationId,
    staleBefore,
  );

  if (!claimed) {
    const concurrentlyCached = await findValidatedAnalysis(
      input.analysisRepository,
      document.id,
    );

    if (concurrentlyCached) {
      return responseFor(document.id, concurrentlyCached);
    }

    throw new DocumentAnalysisError(
      "ANALYSIS_IN_PROGRESS",
      409,
      "Bu belge zaten analiz ediliyor.",
    );
  }

  try {
    const providerResult = await input.analysisProvider.analyzeDocument({
      providerFileName: document.providerFileName,
      providerFileUri: document.providerFileUri,
      mimeType: document.mimeType,
      prompt: DOCUMENT_ANALYSIS_PROMPT,
    });
    const validatedResult = documentAnalysisSchema.safeParse(providerResult);

    if (!validatedResult.success) {
      throw new DocumentAnalysisProviderError(
        "invalid-response",
        validatedResult.error,
      );
    }

    await input.analysisRepository.saveAndMarkDocumentAnalyzed({
      documentId: document.id,
      schemaVersion: DOCUMENT_ANALYSIS_SCHEMA_VERSION,
      promptVersion: DOCUMENT_ANALYSIS_PROMPT_VERSION,
      model: input.analysisProvider.model,
      analysis: validatedResult.data,
    });

    const persisted = await findValidatedAnalysis(
      input.analysisRepository,
      document.id,
    );

    if (!persisted) {
      throw new DocumentAnalysisError(
        "INTERNAL_ERROR",
        500,
        "İşlem şu anda tamamlanamadı.",
      );
    }

    return responseFor(document.id, persisted);
  } catch (error) {
    await resetAnalysisWithoutMasking(
      input.documentRepository,
      document.id,
      identifiers.installationId,
    );

    if (error instanceof DocumentAnalysisError) {
      throw error;
    }

    if (error instanceof DocumentAnalysisProviderError) {
      throw mapProviderError(error);
    }

    throw new DocumentAnalysisError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      error,
    );
  }
}

export async function getStoredDocumentAnalysis(
  input: Omit<DocumentAnalysisServiceInput, "analysisProvider">,
): Promise<AnalyzeDocumentResponse> {
  const identifiers = validateIdentifiers(
    input.documentId,
    input.installationId,
  );
  const document = await findOwnedDocument(input, identifiers);
  const analysis = await findValidatedAnalysis(
    input.analysisRepository,
    document.id,
  );

  if (!analysis) {
    throw new DocumentAnalysisError(
      "ANALYSIS_NOT_FOUND",
      404,
      "Bu belgeye ait tamamlanmış bir analiz bulunamadı.",
    );
  }

  return responseFor(document.id, analysis);
}

function validateIdentifiers(documentId: string, installationId: string) {
  const documentResult = documentIdSchema.safeParse(documentId);
  const installationResult = installationIdSchema.safeParse(installationId);

  if (!documentResult.success || !installationResult.success) {
    throw new DocumentAnalysisError(
      "INVALID_REQUEST",
      400,
      "Geçersiz istek.",
    );
  }

  return {
    documentId: documentResult.data,
    installationId: installationResult.data,
  };
}

async function findOwnedDocument(
  input: Pick<DocumentAnalysisServiceInput, "documentRepository">,
  identifiers: { documentId: string; installationId: string },
): Promise<DocumentRecord> {
  const document = await input.documentRepository.findByIdForInstallation(
    identifiers.documentId,
    identifiers.installationId,
  );

  if (!document) {
    throw new DocumentAnalysisError(
      "DOCUMENT_NOT_FOUND",
      404,
      "Belge bulunamadı. PDF'yi yeniden seçebilirsin.",
    );
  }

  return document;
}

function assertDocumentCanBeAnalyzed(document: DocumentRecord): void {
  if (document.status === "analyzed") {
    throw new DocumentAnalysisError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
    );
  }

  if (
    document.providerExpiresAt &&
    !Number.isNaN(Date.parse(document.providerExpiresAt)) &&
    Date.parse(document.providerExpiresAt) <= Date.now()
  ) {
    throw new DocumentAnalysisError(
      "DOCUMENT_EXPIRED",
      410,
      "Bu belgenin geçici analiz süresi dolmuş. Lütfen PDF'yi yeniden yükle.",
    );
  }
}

async function findValidatedAnalysis(
  repository: DocumentAnalysisRepository,
  documentId: string,
): Promise<DocumentAnalysis | null> {
  const stored = await repository.findByDocumentId(documentId);

  if (!stored) {
    return null;
  }

  return validateStoredAnalysis(stored);
}

function validateStoredAnalysis(
  stored: StoredDocumentAnalysis,
): DocumentAnalysis {
  const result = documentAnalysisSchema.safeParse({
    title: stored.title,
    summary: stored.summary,
    topics: stored.topics,
  });

  if (!result.success) {
    throw new DocumentAnalysisError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      result.error,
    );
  }

  return result.data;
}

function responseFor(
  documentId: string,
  analysis: DocumentAnalysis,
): AnalyzeDocumentResponse {
  return analyzeDocumentResponseSchema.parse({
    document: { id: documentId, status: "analyzed" },
    analysis,
  });
}

function mapProviderError(
  error: DocumentAnalysisProviderError,
): DocumentAnalysisError {
  if (error.kind === "document-expired") {
    return new DocumentAnalysisError(
      "DOCUMENT_EXPIRED",
      410,
      "Bu belgenin geçici analiz süresi dolmuş. Lütfen PDF'yi yeniden yükle.",
      error,
    );
  }

  if (
    error.kind === "invalid-response" ||
    error.kind === "safety" ||
    error.kind === "file-processing-failed"
  ) {
    return new DocumentAnalysisError(
      "ANALYSIS_FAILED",
      422,
      "Bu belge şu anda analiz edilemedi. Tekrar deneyebilirsin.",
      error,
    );
  }

  if (error.kind === "timeout") {
    return new DocumentAnalysisError(
      "UPSTREAM_ERROR",
      502,
      "Belge analizi beklenenden uzun sürdü. Tekrar deneyebilirsin.",
      error,
    );
  }

  return new DocumentAnalysisError(
    "UPSTREAM_ERROR",
    502,
    "Belge analiz servisine şu anda ulaşılamıyor. Tekrar deneyebilirsin.",
    error,
  );
}

async function resetAnalysisWithoutMasking(
  repository: DocumentRepository,
  documentId: string,
  installationId: string,
): Promise<void> {
  try {
    await repository.resetAnalysis(documentId, installationId);
  } catch {
    console.error(
      JSON.stringify({
        event: "document_analysis_state_reset_failed",
      }),
    );
  }
}
