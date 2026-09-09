import {
  installationIdSchema,
  lessonIdSchema,
  lessonSchema,
  teacherMessageRequestSchema,
  teacherMessageResponseSchema,
  teacherMessageSchema,
  teacherRelatedSectionSchema,
  teacherThreadIdSchema,
  teacherThreadResponseSchema,
  type ApiErrorResponse,
  type Lesson,
  type TeacherMessage,
  type TeacherMessageResponse,
  type TeacherThreadResponse,
} from "@anlat-hoca/contracts";
import {
  MAX_TEACHER_CONTEXT_TURNS,
  MAX_TEACHER_QUESTIONS_PER_UTC_DAY,
} from "@anlat-hoca/config";
import {
  buildTeacherAnswerPrompt,
  TEACHER_ANSWER_PROMPT_VERSION,
} from "@anlat-hoca/prompts";
import { z } from "zod";

import type {
  DocumentLessonRepository,
  StoredLesson,
} from "../data/document-lesson-repository";
import type {
  StoredTeacherMessage,
  TeacherMessageRepository,
} from "../data/teacher-message-repository";
import type {
  StoredTeacherThread,
  TeacherThreadRepository,
} from "../data/teacher-thread-repository";
import {
  generatedTeacherAnswerSchema,
  TeacherAnswerProviderError,
  type GeneratedTeacherAnswer,
  type TeacherAnswerProvider,
} from "../providers/ai/teacher-answer-provider";

type TeacherErrorCode = ApiErrorResponse["error"]["code"];
type TeacherErrorStatus = 400 | 404 | 429 | 500 | 502 | 503;

const storedRelatedSectionsSchema = z.array(teacherRelatedSectionSchema).max(3);
const storedFollowUpsSchema = z.array(z.string().trim().min(1).max(180)).max(3);

export class TeacherConversationError extends Error {
  constructor(
    readonly code: TeacherErrorCode,
    readonly status: TeacherErrorStatus,
    readonly publicMessage: string,
    cause?: unknown,
  ) {
    super("Teacher conversation operation failed.", { cause });
    this.name = "TeacherConversationError";
  }
}

interface TeacherDependencies {
  lessonRepository: DocumentLessonRepository;
  threadRepository: TeacherThreadRepository;
  messageRepository: TeacherMessageRepository;
}

export async function getOrCreateTeacherThread(
  input: TeacherDependencies & {
    lessonId: string;
    installationId: string;
  },
): Promise<TeacherThreadResponse> {
  const identifiers = validateLessonIdentifiers(
    input.lessonId,
    input.installationId,
  );
  const lesson = await findOwnedLesson(
    input.lessonRepository,
    identifiers.lessonId,
    identifiers.installationId,
  );
  const thread = await input.threadRepository.findOrCreate(
    lesson.id,
    identifiers.installationId,
  );

  return buildThreadResponse(
    lesson,
    thread,
    await input.messageRepository.listAll(thread.id),
  );
}

export async function getTeacherThreadDetail(
  input: TeacherDependencies & {
    threadId: string;
    installationId: string;
  },
): Promise<TeacherThreadResponse> {
  const threadIdResult = teacherThreadIdSchema.safeParse(input.threadId);
  const installationIdResult = installationIdSchema.safeParse(
    input.installationId,
  );

  if (!threadIdResult.success || !installationIdResult.success) {
    throw invalidRequestError();
  }

  const thread = await input.threadRepository.findByIdForInstallation(
    threadIdResult.data,
    installationIdResult.data,
  );

  if (!thread) {
    throw threadNotFoundError();
  }

  const lesson = await findOwnedLesson(
    input.lessonRepository,
    thread.lessonId,
    installationIdResult.data,
    threadNotFoundError,
  );

  return buildThreadResponse(
    lesson,
    thread,
    await input.messageRepository.listAll(thread.id),
  );
}

export async function sendTeacherMessage(
  input: TeacherDependencies & {
    lessonId: string;
    body: unknown;
    teacherProvider?: TeacherAnswerProvider;
    now?: Date;
  },
): Promise<TeacherMessageResponse> {
  const lessonIdResult = lessonIdSchema.safeParse(input.lessonId);
  const requestResult = teacherMessageRequestSchema.safeParse(input.body);

  if (!lessonIdResult.success || !requestResult.success) {
    throw new TeacherConversationError(
      "INVALID_TEACHER_MESSAGE",
      400,
      "Sorunu 1–1200 karakter arasında yazarak tekrar dene.",
    );
  }

  const lesson = await findOwnedLesson(
    input.lessonRepository,
    lessonIdResult.data,
    requestResult.data.installationId,
  );
  const thread = await input.threadRepository.findOrCreate(
    lesson.id,
    requestResult.data.installationId,
  );
  const now = input.now ?? new Date();
  const [startInclusive, endExclusive] = utcDayBounds(now);
  const dailyCount =
    await input.messageRepository.countUserMessagesForInstallation(
      requestResult.data.installationId,
      startInclusive,
      endExclusive,
    );

  if (dailyCount >= MAX_TEACHER_QUESTIONS_PER_UTC_DAY) {
    throw new TeacherConversationError(
      "USAGE_LIMIT_REACHED",
      429,
      "Bugünkü soru sınırına ulaştın. Yarın tekrar sorabilirsin.",
    );
  }

  if (!input.teacherProvider) {
    throw new TeacherConversationError(
      "AI_NOT_CONFIGURED",
      503,
      "Hocaya Sor servisi şu anda yapılandırılmamış.",
    );
  }

  try {
    const recent = await input.messageRepository.listRecent(
      thread.id,
      MAX_TEACHER_CONTEXT_TURNS * 2,
    );
    const generated = await input.teacherProvider.generateAnswer({
      prompt: buildTeacherAnswerPrompt({
        question: requestResult.data.message,
        recentMessages: recent.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        lesson: {
          title: lesson.title,
          overview: lesson.overview,
          learningObjectives: lesson.learningObjectives,
          sections: lesson.sections,
          recap: lesson.recap,
          skippedTopics: lesson.skippedTopics,
        },
      }),
    });
    const relatedSections = validateGeneratedAnswer(generated, lesson);
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const createdAt = now.toISOString();
    const stored = await input.messageRepository.appendExchange({
      threadId: thread.id,
      userMessageId,
      userContent: requestResult.data.message,
      assistantMessageId,
      assistantContent: generated.answer,
      relatedSections,
      suggestedFollowUps: generated.suggestedFollowUps,
      promptVersion: TEACHER_ANSWER_PROMPT_VERSION,
      model: input.teacherProvider.model,
      createdAt,
    });

    return teacherMessageResponseSchema.parse({
      threadId: thread.id,
      userMessage: {
        id: userMessageId,
        role: "user",
        content: requestResult.data.message,
        relatedSections: [],
        suggestedFollowUps: [],
        createdAt,
      },
      message: toPublicMessage(stored),
    });
  } catch (error) {
    if (error instanceof TeacherConversationError) {
      throw error;
    }

    if (error instanceof TeacherAnswerProviderError) {
      throw mapProviderError(error);
    }

    throw new TeacherConversationError(
      "INTERNAL_ERROR",
      500,
      "İşlem şu anda tamamlanamadı.",
      error,
    );
  }
}

export function validateGeneratedAnswer(
  answer: GeneratedTeacherAnswer,
  lesson: Lesson,
) {
  const parsed = generatedTeacherAnswerSchema.safeParse(answer);

  if (!parsed.success) {
    throw new TeacherAnswerProviderError("invalid-response", parsed.error);
  }

  const uniqueIndexes = new Set(parsed.data.relatedSectionIndexes);

  if (
    uniqueIndexes.size !== parsed.data.relatedSectionIndexes.length ||
    parsed.data.relatedSectionIndexes.some(
      (sectionIndex) => sectionIndex >= lesson.sections.length,
    )
  ) {
    throw new TeacherAnswerProviderError("invalid-response");
  }

  return parsed.data.relatedSectionIndexes.map((sectionIndex) => ({
    sectionIndex,
    title: lesson.sections[sectionIndex].title,
  }));
}

function buildThreadResponse(
  lesson: Lesson,
  thread: StoredTeacherThread,
  messages: StoredTeacherMessage[],
): TeacherThreadResponse {
  return teacherThreadResponseSchema.parse({
    thread: {
      id: thread.id,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      messages: messages.map(toPublicMessage),
    },
  });
}

function toPublicMessage(message: StoredTeacherMessage): TeacherMessage {
  return teacherMessageSchema.parse({
    id: message.id,
    role: message.role,
    content: message.content,
    relatedSections:
      message.role === "assistant"
        ? storedRelatedSectionsSchema.parse(message.relatedSections)
        : [],
    suggestedFollowUps:
      message.role === "assistant"
        ? storedFollowUpsSchema.parse(message.suggestedFollowUps)
        : [],
    createdAt: message.createdAt,
  });
}

function validateLessonIdentifiers(lessonId: string, installationId: string) {
  const lessonIdResult = lessonIdSchema.safeParse(lessonId);
  const installationIdResult = installationIdSchema.safeParse(installationId);

  if (!lessonIdResult.success || !installationIdResult.success) {
    throw invalidRequestError();
  }

  return {
    lessonId: lessonIdResult.data,
    installationId: installationIdResult.data,
  };
}

async function findOwnedLesson(
  repository: DocumentLessonRepository,
  lessonId: string,
  installationId: string,
  errorFactory: () => TeacherConversationError = lessonNotFoundError,
): Promise<Lesson> {
  const stored = await repository.findByIdForInstallation(
    lessonId,
    installationId,
  );
  const lesson = stored ? parseStoredLesson(stored) : null;

  if (!lesson) {
    throw errorFactory();
  }

  return lesson;
}

function parseStoredLesson(stored: StoredLesson): Lesson {
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
    throw new Error("Stored lesson content is invalid.", {
      cause: result.error,
    });
  }

  return result.data;
}

function utcDayBounds(now: Date): [string, string] {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1_000);
  return [start.toISOString(), end.toISOString()];
}

function mapProviderError(error: TeacherAnswerProviderError) {
  if (error.kind === "authentication") {
    return new TeacherConversationError(
      "AI_NOT_CONFIGURED",
      503,
      "Hocaya Sor servisi şu anda yapılandırılmamış.",
      error,
    );
  }

  return new TeacherConversationError(
    "TEACHER_RESPONSE_FAILED",
    502,
    "Hoca şu anda yanıt veremedi. Sorun kaydedilmedi; tekrar deneyebilirsin.",
    error,
  );
}

function invalidRequestError() {
  return new TeacherConversationError(
    "INVALID_REQUEST",
    400,
    "Geçersiz istek.",
  );
}

function lessonNotFoundError() {
  return new TeacherConversationError(
    "LESSON_NOT_FOUND",
    404,
    "Bu ders bulunamadı.",
  );
}

function threadNotFoundError() {
  return new TeacherConversationError(
    "TEACHER_THREAD_NOT_FOUND",
    404,
    "Bu konuşma bulunamadı.",
  );
}
