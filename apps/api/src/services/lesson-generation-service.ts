import {
  documentAnalysisSchema,
  documentIdSchema,
  installationIdSchema,
  lessonContentSchema,
  lessonDetailResponseSchema,
  lessonDurationMinuteRanges,
  lessonDurationSchema,
  lessonGenerationResponseSchema,
  lessonIdSchema,
  lessonSchema,
  type ApiErrorResponse,
  type DocumentAnalysis,
  type Lesson,
  type LessonDetailResponse,
  type LessonDuration,
  type LessonGenerationResponse,
} from "@anlat-hoca/contracts";
import {
  buildLessonGenerationPrompt,
  LESSON_GENERATION_PROMPT_VERSION,
} from "@anlat-hoca/prompts";

import type { DocumentAnalysisRepository } from "../data/document-analysis-repository";
import type {
  DocumentLessonRepository,
  LessonCacheIdentity,
  StoredLesson,
} from "../data/document-lesson-repository";
import type {
  DocumentRecord,
  DocumentRepository,
} from "../data/document-repository";
import {
  LessonGenerationProviderError,
  type LessonGenerationProvider,
} from "../providers/ai/lesson-generation-provider";

export const LESSON_SCHEMA_VERSION = "v1";
const LESSON_LOCK_STALE_MS = 3 * 60 * 1_000;

type LessonErrorCode = ApiErrorResponse["error"]["code"];
type LessonErrorStatus = 400 | 404 | 409 | 410 | 422 | 500 | 502 | 503;

export class LessonGenerationError extends Error {
  constructor(
    readonly code: LessonErrorCode,
    readonly status: LessonErrorStatus,
    readonly publicMessage: string,
    cause?: unknown,
  ) {
    super("Lesson generation failed.", { cause });
    this.name = "LessonGenerationError";
  }
}

interface GenerateLessonInput {
  documentId: string;
  installationId: string;
  durationMinutes: unknown;
  model: string;
  documentRepository: DocumentRepository;
  analysisRepository: DocumentAnalysisRepository;
  lessonRepository: DocumentLessonRepository;
  lessonProvider?: LessonGenerationProvider;
}

export interface GenerateLessonResult {
  response: LessonGenerationResponse;
  created: boolean;
}

export async function generateLesson(
  input: GenerateLessonInput,
): Promise<GenerateLessonResult> {
  const identifiers = validateGenerationInput(input);
  const document = await findOwnedDocument(input, identifiers);
  const analysis = await requireValidatedAnalysis(
    input.analysisRepository,
    document.id,
  );
  const identity: LessonCacheIdentity = {
    documentId: document.id,
    durationMinutes: identifiers.durationMinutes,
    schemaVersion: LESSON_SCHEMA_VERSION,
    promptVersion: LESSON_GENERATION_PROMPT_VERSION,
    model: input.model,
  };
  const cached = await input.lessonRepository.findCurrentLesson(identity);

  if (cached?.status === "ready") {
    return { response: generationResponse(validateStoredLesson(cached)), created: false };
  }

  const generationToken = crypto.randomUUID();
  let lessonId: string;

  if (cached?.status === "generating") {
    const staleBefore = new Date(
      Date.now() - LESSON_LOCK_STALE_MS,
    ).toISOString();
    const reclaimedId = await input.lessonRepository.reclaimStaleGeneration(
      identity,
      generationToken,
      staleBefore,
    );

    if (!reclaimedId) {
      throw lessonInProgressError();
    }

    lessonId = reclaimedId;
  } else {
    lessonId = crypto.randomUUID();
    const claimed = await input.lessonRepository.createGenerationClaim({
      ...identity,
      id: lessonId,
      generationToken,
    });

    if (!claimed) {
      const concurrent = await input.lessonRepository.findCurrentLesson(identity);

      if (concurrent?.status === "ready") {
        return {
          response: generationResponse(validateStoredLesson(concurrent)),
          created: false,
        };
      }

      throw lessonInProgressError();
    }
  }

  try {
    assertSourceAvailable(document);

    if (!input.lessonProvider) {
      throw new LessonGenerationError(
        "AI_NOT_CONFIGURED",
        503,
        "Ders oluşturma servisi şu anda yapılandırılmamış.",
      );
    }

    const providerResult = await input.lessonProvider.generateLesson({
      providerFileName: document.providerFileName,
      providerFileUri: document.providerFileUri,
      mimeType: document.mimeType,
      prompt: buildLessonGenerationPrompt({
        durationMinutes: identifiers.durationMinutes,
        analysis,
      }),
    });
    const contentResult = lessonContentSchema.safeParse(providerResult);

    if (!contentResult.success) {
      throw new LessonGenerationProviderError(
        "invalid-response",
        contentResult.error,
      );
    }

    validateDurationAllocation(
      identifiers.durationMinutes,
      contentResult.data.sections.map((section) => section.estimatedMinutes),
    );

    await input.lessonRepository.completeGeneration({
      id: lessonId,
      generationToken,
      content: contentResult.data,
    });

    const persisted = await input.lessonRepository.findByIdForInstallation(
      lessonId,
      identifiers.installationId,
    );

    if (!persisted) {
      throw new LessonGenerationError(
        "INTERNAL_ERROR",
        500,
        "İşlem şu anda tamamlanamadı.",
      );
    }

    return {
      response: generationResponse(validateStoredLesson(persisted)),
      created: true,
    };
  } catch (error) {
    await releaseClaimWithoutMasking(
      input.lessonRepository,
      lessonId,
      generationToken,
    );

    if (error instanceof LessonGenerationError) {
      throw error;
    }

    if (error instanceof LessonGenerationProviderError) {
      throw mapProviderError(error);
    }

    throw new LessonGenerationError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      error,
    );
  }
}

export async function getLessonDetail(input: {
  lessonId: string;
  installationId: string;
  lessonRepository: DocumentLessonRepository;
}): Promise<LessonDetailResponse> {
  const lessonIdResult = lessonIdSchema.safeParse(input.lessonId);
  const installationIdResult = installationIdSchema.safeParse(
    input.installationId,
  );

  if (!lessonIdResult.success || !installationIdResult.success) {
    throw new LessonGenerationError(
      "INVALID_REQUEST",
      400,
      "Geçersiz istek.",
    );
  }

  const stored = await input.lessonRepository.findByIdForInstallation(
    lessonIdResult.data,
    installationIdResult.data,
  );

  if (!stored) {
    throw new LessonGenerationError(
      "LESSON_NOT_FOUND",
      404,
      "Ders bulunamadı.",
    );
  }

  return lessonDetailResponseSchema.parse({
    lesson: validateStoredLesson(stored),
  });
}

export function validateDurationAllocation(
  durationMinutes: LessonDuration,
  sectionMinutes: number[],
): void {
  const total = sectionMinutes.reduce((sum, minutes) => sum + minutes, 0);
  const [minimum, maximum] = lessonDurationMinuteRanges[durationMinutes];

  if (total < minimum || total > maximum) {
    throw new LessonGenerationProviderError("invalid-response");
  }
}

function validateGenerationInput(input: GenerateLessonInput) {
  const documentResult = documentIdSchema.safeParse(input.documentId);
  const installationResult = installationIdSchema.safeParse(
    input.installationId,
  );
  const durationResult = lessonDurationSchema.safeParse(input.durationMinutes);

  if (!durationResult.success) {
    throw new LessonGenerationError(
      "INVALID_LESSON_DURATION",
      400,
      "Çalışma süresi 10, 30 veya 60 dakika olmalıdır.",
    );
  }

  if (!documentResult.success || !installationResult.success) {
    throw new LessonGenerationError(
      "INVALID_REQUEST",
      400,
      "Geçersiz istek.",
    );
  }

  return {
    documentId: documentResult.data,
    installationId: installationResult.data,
    durationMinutes: durationResult.data,
  };
}

async function findOwnedDocument(
  input: Pick<GenerateLessonInput, "documentRepository">,
  identifiers: { documentId: string; installationId: string },
): Promise<DocumentRecord> {
  const document = await input.documentRepository.findByIdForInstallation(
    identifiers.documentId,
    identifiers.installationId,
  );

  if (!document) {
    throw new LessonGenerationError(
      "DOCUMENT_NOT_FOUND",
      404,
      "Belge bulunamadı. PDF'yi yeniden seçebilirsin.",
    );
  }

  return document;
}

async function requireValidatedAnalysis(
  repository: DocumentAnalysisRepository,
  documentId: string,
): Promise<DocumentAnalysis> {
  const stored = await repository.findByDocumentId(documentId);

  if (!stored) {
    throw new LessonGenerationError(
      "ANALYSIS_REQUIRED",
      409,
      "Ders oluşturmadan önce belgeyi analiz etmelisin.",
    );
  }

  const result = documentAnalysisSchema.safeParse(stored);

  if (!result.success) {
    throw new LessonGenerationError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      result.error,
    );
  }

  return result.data;
}

function assertSourceAvailable(document: DocumentRecord): void {
  if (
    document.providerExpiresAt &&
    !Number.isNaN(Date.parse(document.providerExpiresAt)) &&
    Date.parse(document.providerExpiresAt) <= Date.now()
  ) {
    throw new LessonGenerationError(
      "DOCUMENT_EXPIRED",
      410,
      "Bu belgenin geçici analiz süresi dolmuş. PDF'yi yeniden yükle.",
    );
  }
}

function validateStoredLesson(stored: StoredLesson): Lesson {
  if (stored.status !== "ready") {
    throw new LessonGenerationError(
      "LESSON_IN_PROGRESS",
      409,
      "Bu ders zaten hazırlanıyor.",
    );
  }

  const result = lessonSchema.safeParse({
    id: stored.id,
    documentId: stored.documentId,
    durationMinutes: stored.durationMinutes,
    title: stored.title,
    overview: stored.overview,
    learningObjectives: stored.learningObjectives,
    sections: stored.sections,
    recap: stored.recap,
    skippedTopics: stored.skippedTopics,
  });

  if (!result.success) {
    throw new LessonGenerationError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      result.error,
    );
  }

  validateDurationAllocation(
    result.data.durationMinutes,
    result.data.sections.map((section) => section.estimatedMinutes),
  );

  return result.data;
}

function generationResponse(lesson: Lesson): LessonGenerationResponse {
  return lessonGenerationResponseSchema.parse({ lesson });
}

function lessonInProgressError(): LessonGenerationError {
  return new LessonGenerationError(
    "LESSON_IN_PROGRESS",
    409,
    "Bu ders zaten hazırlanıyor.",
  );
}

function mapProviderError(
  error: LessonGenerationProviderError,
): LessonGenerationError {
  if (error.kind === "document-expired") {
    return new LessonGenerationError(
      "DOCUMENT_EXPIRED",
      410,
      "Bu belgenin geçici analiz süresi dolmuş. PDF'yi yeniden yükle.",
      error,
    );
  }

  if (
    error.kind === "invalid-response" ||
    error.kind === "safety" ||
    error.kind === "file-processing-failed"
  ) {
    return new LessonGenerationError(
      "LESSON_GENERATION_FAILED",
      422,
      "Ders şu anda oluşturulamadı. Tekrar deneyebilirsin.",
      error,
    );
  }

  return new LessonGenerationError(
    "UPSTREAM_ERROR",
    502,
    "Ders oluşturma servisine şu anda ulaşılamıyor. Tekrar deneyebilirsin.",
    error,
  );
}

async function releaseClaimWithoutMasking(
  repository: DocumentLessonRepository,
  lessonId: string,
  generationToken: string,
): Promise<void> {
  try {
    await repository.releaseGenerationClaim(lessonId, generationToken);
  } catch {
    console.error(JSON.stringify({ event: "lesson_generation_claim_release_failed" }));
  }
}
