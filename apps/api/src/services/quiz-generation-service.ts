import {
  generateQuizResponseSchema,
  installationIdSchema,
  lessonIdSchema,
  lessonSchema,
  publicQuizSchema,
  quizAttemptDetailResponseSchema,
  quizAttemptIdSchema,
  quizIdSchema,
  quizSubmissionAnswerSchema,
  quizSubmissionRequestSchema,
  quizSubmissionResponseSchema,
  weakQuizSectionSchema,
  type ApiErrorResponse,
  type GenerateQuizResponse,
  type Lesson,
  type PublicQuiz,
  type QuizAttemptDetailResponse,
  type QuizAttemptResult,
  type QuizSubmissionAnswer,
  type QuizSubmissionResponse,
  type WeakQuizSection,
} from "@anlat-hoca/contracts";
import { getQuizQuestionCount } from "@anlat-hoca/config";
import {
  buildQuizGenerationPrompt,
  QUIZ_GENERATION_PROMPT_VERSION,
} from "@anlat-hoca/prompts";
import { z } from "zod";

import type {
  LessonQuizRepository,
  PersistedQuizQuestion,
  QuizCacheIdentity,
  StoredQuiz,
} from "../data/lesson-quiz-repository";
import type { QuizAttemptRepository } from "../data/quiz-attempt-repository";
import type {
  DocumentLessonRepository,
  StoredLesson,
} from "../data/document-lesson-repository";
import {
  generatedQuizSchema,
  QuizGenerationProviderError,
  type GeneratedQuiz,
  type QuizGenerationProvider,
} from "../providers/ai/quiz-generation-provider";
import { isGeneratedQuizSemanticallyValid } from "./quiz-generation-validation";

export const QUIZ_SCHEMA_VERSION = "v1";
const QUIZ_LOCK_STALE_MS = 3 * 60 * 1_000;

const persistedQuizQuestionSchema = generatedQuizSchema.shape.questions.element
  .extend({ id: z.string().uuid() })
  .strict();
const persistedQuizQuestionsSchema = z
  .array(persistedQuizQuestionSchema)
  .min(1)
  .max(10);
const storedAnswersSchema = z.array(quizSubmissionAnswerSchema).min(1).max(10);
const storedWeakSectionsSchema = z.array(weakQuizSectionSchema).max(12);

type QuizErrorCode = ApiErrorResponse["error"]["code"];
type QuizErrorStatus = 400 | 404 | 409 | 422 | 500 | 502 | 503;

export class QuizGenerationError extends Error {
  constructor(
    readonly code: QuizErrorCode,
    readonly status: QuizErrorStatus,
    readonly publicMessage: string,
    cause?: unknown,
  ) {
    super("Quiz operation failed.", { cause });
    this.name = "QuizGenerationError";
  }
}

interface GenerateQuizInput {
  lessonId: string;
  installationId: string;
  model: string;
  lessonRepository: DocumentLessonRepository;
  quizRepository: LessonQuizRepository;
  quizProvider?: QuizGenerationProvider;
}

export interface GenerateQuizResult {
  response: GenerateQuizResponse;
  created: boolean;
}

export async function generateQuiz(
  input: GenerateQuizInput,
): Promise<GenerateQuizResult> {
  const identifiers = validateLessonIdentifiers(
    input.lessonId,
    input.installationId,
  );
  const lesson = await findOwnedLesson(
    input.lessonRepository,
    identifiers.lessonId,
    identifiers.installationId,
  );
  const questionCount = getQuizQuestionCount(lesson.durationMinutes);
  const identity: QuizCacheIdentity = {
    lessonId: lesson.id,
    schemaVersion: QUIZ_SCHEMA_VERSION,
    promptVersion: QUIZ_GENERATION_PROMPT_VERSION,
    model: input.model,
  };
  const cached = await input.quizRepository.findCurrentQuiz(identity);

  if (cached?.status === "ready") {
    return responseForStoredQuiz(cached, false);
  }

  const generationToken = crypto.randomUUID();
  let quizId: string;

  if (cached?.status === "generating") {
    const staleBefore = new Date(Date.now() - QUIZ_LOCK_STALE_MS).toISOString();
    const reclaimedId = await input.quizRepository.reclaimStaleGeneration(
      identity,
      generationToken,
      staleBefore,
    );

    if (!reclaimedId) {
      throw quizInProgressError();
    }

    quizId = reclaimedId;
  } else {
    quizId = crypto.randomUUID();
    const claimed = await input.quizRepository.createGenerationClaim({
      ...identity,
      id: quizId,
      generationToken,
    });

    if (!claimed) {
      const concurrent = await input.quizRepository.findCurrentQuiz(identity);

      if (concurrent?.status === "ready") {
        return responseForStoredQuiz(concurrent, false);
      }

      throw quizInProgressError();
    }
  }

  try {
    if (!input.quizProvider) {
      throw new QuizGenerationError(
        "AI_NOT_CONFIGURED",
        503,
        "Quiz hazırlama servisi şu anda yapılandırılmamış.",
      );
    }

    const generated = await input.quizProvider.generateQuiz({
      questionCount,
      prompt: buildQuizGenerationPrompt({
        questionCount,
        lesson: {
          title: lesson.title,
          overview: lesson.overview,
          learningObjectives: lesson.learningObjectives,
          sections: lesson.sections,
          recap: lesson.recap,
        },
      }),
    });

    validateGeneratedQuiz(generated, questionCount, lesson.sections.length);
    const questions: PersistedQuizQuestion[] = generated.questions.map(
      (question) => ({ ...question, id: crypto.randomUUID() }),
    );

    await input.quizRepository.completeGeneration({
      id: quizId,
      generationToken,
      title: generated.title,
      questions,
    });

    const persisted = await input.quizRepository.findByIdForInstallation(
      quizId,
      identifiers.installationId,
    );

    if (!persisted) {
      throw internalQuizError();
    }

    return responseForStoredQuiz(persisted, true);
  } catch (error) {
    await releaseClaimWithoutMasking(
      input.quizRepository,
      quizId,
      generationToken,
    );

    if (error instanceof QuizGenerationError) {
      throw error;
    }

    if (error instanceof QuizGenerationProviderError) {
      throw mapProviderError(error);
    }

    throw new QuizGenerationError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      error,
    );
  }
}

export async function getQuizDetail(input: {
  quizId: string;
  installationId: string;
  quizRepository: LessonQuizRepository;
}): Promise<GenerateQuizResponse> {
  const identifiers = validateQuizIdentifiers(
    input.quizId,
    input.installationId,
  );
  const stored = await input.quizRepository.findByIdForInstallation(
    identifiers.quizId,
    identifiers.installationId,
  );

  if (!stored) {
    throw quizNotFoundError();
  }

  return responseForStoredQuiz(stored, false).response;
}

export async function submitQuiz(input: {
  quizId: string;
  body: unknown;
  lessonRepository: DocumentLessonRepository;
  quizRepository: LessonQuizRepository;
  attemptRepository: QuizAttemptRepository;
}): Promise<QuizSubmissionResponse> {
  const quizIdResult = quizIdSchema.safeParse(input.quizId);
  const requestResult = quizSubmissionRequestSchema.safeParse(input.body);

  if (!quizIdResult.success || !requestResult.success) {
    throw invalidSubmissionError();
  }

  const quiz = await input.quizRepository.findByIdForInstallation(
    quizIdResult.data,
    requestResult.data.installationId,
  );

  if (!quiz) {
    throw quizNotFoundError();
  }

  const internalQuiz = validateStoredQuiz(quiz);
  const lesson = await findOwnedLesson(
    input.lessonRepository,
    internalQuiz.lessonId,
    requestResult.data.installationId,
  );
  validateSubmissionAnswers(
    internalQuiz.questions,
    requestResult.data.answers,
  );

  const attemptId = crypto.randomUUID();
  const graded = gradeQuiz(
    attemptId,
    internalQuiz,
    lesson,
    requestResult.data.answers,
    new Date().toISOString(),
  );
  const persisted = await input.attemptRepository.create({
    id: attemptId,
    quizId: internalQuiz.id,
    installationId: requestResult.data.installationId,
    answers: requestResult.data.answers,
    correctCount: graded.correctCount,
    totalQuestions: graded.totalQuestions,
    scorePercent: graded.scorePercent,
    weakSections: graded.weakSections,
  });

  return quizSubmissionResponseSchema.parse({
    attempt: { ...graded, createdAt: persisted.createdAt },
  });
}

export async function getQuizAttemptDetail(input: {
  attemptId: string;
  installationId: string;
  lessonRepository: DocumentLessonRepository;
  quizRepository: LessonQuizRepository;
  attemptRepository: QuizAttemptRepository;
}): Promise<QuizAttemptDetailResponse> {
  const attemptIdResult = quizAttemptIdSchema.safeParse(input.attemptId);
  const installationIdResult = installationIdSchema.safeParse(
    input.installationId,
  );

  if (!attemptIdResult.success || !installationIdResult.success) {
    throw new QuizGenerationError(
      "INVALID_REQUEST",
      400,
      "Geçersiz istek.",
    );
  }

  const attempt = await input.attemptRepository.findByIdForInstallation(
    attemptIdResult.data,
    installationIdResult.data,
  );

  if (!attempt) {
    throw attemptNotFoundError();
  }

  const quiz = await input.quizRepository.findByIdForInstallation(
    attempt.quizId,
    installationIdResult.data,
  );

  if (!quiz) {
    throw attemptNotFoundError();
  }

  const internalQuiz = validateStoredQuiz(quiz);
  const lesson = await findOwnedLesson(
    input.lessonRepository,
    internalQuiz.lessonId,
    installationIdResult.data,
  );
  const answers = storedAnswersSchema.parse(attempt.answers);
  const storedWeakSections = storedWeakSectionsSchema.parse(
    attempt.weakSections,
  );
  validateSubmissionAnswers(internalQuiz.questions, answers);
  const graded = gradeQuiz(
    attempt.id,
    internalQuiz,
    lesson,
    answers,
    attempt.createdAt,
  );

  if (
    graded.correctCount !== attempt.correctCount ||
    graded.totalQuestions !== attempt.totalQuestions ||
    graded.scorePercent !== attempt.scorePercent ||
    JSON.stringify(graded.weakSections) !== JSON.stringify(storedWeakSections)
  ) {
    throw internalQuizError();
  }

  return quizAttemptDetailResponseSchema.parse({ attempt: graded });
}

export function validateGeneratedQuiz(
  quiz: GeneratedQuiz,
  expectedQuestionCount: number,
  lessonSectionCount: number,
): void {
  const parsed = generatedQuizSchema.safeParse(quiz);

  if (
    !parsed.success ||
    !isGeneratedQuizSemanticallyValid(
      parsed.data,
      expectedQuestionCount,
      lessonSectionCount,
    )
  ) {
    throw new QuizGenerationProviderError("invalid-response");
  }
}

interface ValidatedStoredQuiz {
  id: string;
  lessonId: string;
  title: string;
  questions: PersistedQuizQuestion[];
}

function responseForStoredQuiz(
  stored: StoredQuiz,
  created: boolean,
): GenerateQuizResult {
  return {
    response: generateQuizResponseSchema.parse({
      quiz: toPublicQuiz(validateStoredQuiz(stored)),
    }),
    created,
  };
}

function validateStoredQuiz(stored: StoredQuiz): ValidatedStoredQuiz {
  if (stored.status !== "ready" || stored.title === null) {
    throw quizInProgressError();
  }

  const questionsResult = persistedQuizQuestionsSchema.safeParse(
    stored.questions,
  );

  if (!questionsResult.success) {
    throw internalQuizError();
  }

  return {
    id: stored.id,
    lessonId: stored.lessonId,
    title: stored.title,
    questions: questionsResult.data,
  };
}

function toPublicQuiz(quiz: ValidatedStoredQuiz): PublicQuiz {
  return publicQuizSchema.parse({
    id: quiz.id,
    lessonId: quiz.lessonId,
    title: quiz.title,
    questions: quiz.questions.map(({ id, question, options }) => ({
      id,
      question,
      options,
    })),
  });
}

function validateSubmissionAnswers(
  questions: PersistedQuizQuestion[],
  answers: QuizSubmissionAnswer[],
): void {
  if (answers.length !== questions.length) {
    throw invalidSubmissionError();
  }

  const expectedIds = new Set(questions.map((question) => question.id));
  const submittedIds = new Set(answers.map((answer) => answer.questionId));

  if (
    submittedIds.size !== answers.length ||
    submittedIds.size !== expectedIds.size ||
    [...submittedIds].some((id) => !expectedIds.has(id))
  ) {
    throw invalidSubmissionError();
  }
}

function gradeQuiz(
  attemptId: string,
  quiz: ValidatedStoredQuiz,
  lesson: Lesson,
  answers: QuizSubmissionAnswer[],
  createdAt: string,
): QuizAttemptResult {
  const answersByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedOptionIndex]),
  );
  const wrongCounts = new Map<number, number>();
  let correctCount = 0;

  const questions = quiz.questions.map((question) => {
    const selectedOptionIndex = answersByQuestionId.get(question.id);

    if (selectedOptionIndex === undefined) {
      throw invalidSubmissionError();
    }

    const isCorrect = selectedOptionIndex === question.correctOptionIndex;

    if (isCorrect) {
      correctCount += 1;
    } else {
      wrongCounts.set(
        question.sourceSectionIndex,
        (wrongCounts.get(question.sourceSectionIndex) ?? 0) + 1,
      );
    }

    return {
      questionId: question.id,
      question: question.question,
      options: question.options,
      selectedOptionIndex,
      correctOptionIndex: question.correctOptionIndex,
      isCorrect,
      explanation: question.explanation,
      sourceSectionIndex: question.sourceSectionIndex,
    };
  });

  const weakSections: WeakQuizSection[] = [...wrongCounts.entries()]
    .sort(
      ([leftIndex, leftCount], [rightIndex, rightCount]) =>
        rightCount - leftCount || leftIndex - rightIndex,
    )
    .map(([sectionIndex, wrongAnswers]) => ({
      sectionIndex,
      title: lesson.sections[sectionIndex]?.title ?? "",
      wrongAnswers,
    }));
  const totalQuestions = questions.length;

  return {
    id: attemptId,
    quizId: quiz.id,
    lessonId: quiz.lessonId,
    correctCount,
    totalQuestions,
    scorePercent: Math.round((correctCount / totalQuestions) * 100),
    questions,
    weakSections,
    createdAt,
  };
}

async function findOwnedLesson(
  repository: DocumentLessonRepository,
  lessonId: string,
  installationId: string,
): Promise<Lesson> {
  const stored = await repository.findByIdForInstallation(
    lessonId,
    installationId,
  );

  if (!stored) {
    throw quizNotFoundError();
  }

  return mapStoredLesson(stored);
}

function mapStoredLesson(stored: StoredLesson): Lesson {
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
    throw internalQuizError();
  }

  return result.data;
}

function validateLessonIdentifiers(lessonId: string, installationId: string) {
  const lessonIdResult = lessonIdSchema.safeParse(lessonId);
  const installationIdResult = installationIdSchema.safeParse(installationId);

  if (!lessonIdResult.success || !installationIdResult.success) {
    throw new QuizGenerationError(
      "INVALID_REQUEST",
      400,
      "Geçersiz istek.",
    );
  }

  return {
    lessonId: lessonIdResult.data,
    installationId: installationIdResult.data,
  };
}

function validateQuizIdentifiers(quizId: string, installationId: string) {
  const quizIdResult = quizIdSchema.safeParse(quizId);
  const installationIdResult = installationIdSchema.safeParse(installationId);

  if (!quizIdResult.success || !installationIdResult.success) {
    throw new QuizGenerationError(
      "INVALID_REQUEST",
      400,
      "Geçersiz istek.",
    );
  }

  return {
    quizId: quizIdResult.data,
    installationId: installationIdResult.data,
  };
}

function quizInProgressError(): QuizGenerationError {
  return new QuizGenerationError(
    "QUIZ_IN_PROGRESS",
    409,
    "Bu quiz zaten hazırlanıyor.",
  );
}

function quizNotFoundError(): QuizGenerationError {
  return new QuizGenerationError(
    "QUIZ_NOT_FOUND",
    404,
    "Quiz bulunamadı.",
  );
}

function attemptNotFoundError(): QuizGenerationError {
  return new QuizGenerationError(
    "QUIZ_ATTEMPT_NOT_FOUND",
    404,
    "Quiz sonucu bulunamadı.",
  );
}

function invalidSubmissionError(): QuizGenerationError {
  return new QuizGenerationError(
    "INVALID_QUIZ_SUBMISSION",
    400,
    "Cevaplar gönderilemedi. Lütfen tüm soruları yanıtlayıp tekrar dene.",
  );
}

function internalQuizError(): QuizGenerationError {
  return new QuizGenerationError(
    "INTERNAL_ERROR",
    500,
    "İşlem şu anda tamamlanamadı.",
  );
}

function mapProviderError(
  error: QuizGenerationProviderError,
): QuizGenerationError {
  if (error.kind === "invalid-response" || error.kind === "safety") {
    return new QuizGenerationError(
      "QUIZ_GENERATION_FAILED",
      422,
      "Quiz şu anda hazırlanamadı. Tekrar deneyebilirsin.",
      error,
    );
  }

  return new QuizGenerationError(
    "UPSTREAM_ERROR",
    502,
    "Quiz hazırlama servisine şu anda ulaşılamıyor. Tekrar deneyebilirsin.",
    error,
  );
}

async function releaseClaimWithoutMasking(
  repository: LessonQuizRepository,
  quizId: string,
  generationToken: string,
): Promise<void> {
  try {
    await repository.releaseGenerationClaim(quizId, generationToken);
  } catch {
    console.error(
      JSON.stringify({ event: "quiz_generation_claim_release_failed" }),
    );
  }
}
