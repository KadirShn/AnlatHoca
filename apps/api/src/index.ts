import {
  analyzeDocumentRequestSchema,
  guestSessionRequestSchema,
  generateQuizRequestSchema,
  installationIdSchema,
  lessonDetailRequestSchema,
  lessonDurationSchema,
  lessonGenerationRequestSchema,
  teacherThreadRequestSchema,
  type ApiErrorResponse,
  type ApiHealthResponse,
  type ApiInfoResponse,
  type GuestSessionResponse,
} from "@anlat-hoca/contracts";
import { MAX_PDF_UPLOAD_BODY_BYTES } from "@anlat-hoca/config";
import { Hono } from "hono";
import type { Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";

import { assertDatabaseAvailable } from "./data/database-health";
import {
  resolveGeminiAnalysisModel,
  resolveGeminiLessonModel,
  resolveGeminiQuizModel,
  resolveGeminiTeacherModel,
} from "./config/ai";
import { D1DocumentAnalysisRepository } from "./data/document-analysis-repository";
import { D1DocumentLessonRepository } from "./data/document-lesson-repository";
import { D1DocumentRepository } from "./data/document-repository";
import { D1InstallationRepository } from "./data/installation-repository";
import { D1LessonQuizRepository } from "./data/lesson-quiz-repository";
import { D1QuizAttemptRepository } from "./data/quiz-attempt-repository";
import { D1TeacherMessageRepository } from "./data/teacher-message-repository";
import { D1TeacherThreadRepository } from "./data/teacher-thread-repository";
import { GeminiFilesProvider } from "./providers/files/gemini-files-provider";
import { GeminiDocumentAnalysisProvider } from "./providers/ai/gemini-document-analysis-provider";
import { GeminiLessonGenerationProvider } from "./providers/ai/gemini-lesson-generation-provider";
import { GeminiQuizGenerationProvider } from "./providers/ai/gemini-quiz-generation-provider";
import { GeminiTeacherAnswerProvider } from "./providers/ai/gemini-teacher-answer-provider";
import {
  analyzeDocument,
  DocumentAnalysisError,
  getStoredDocumentAnalysis,
} from "./services/document-analysis-service";
import {
  DocumentUploadError,
  uploadDocument,
} from "./services/document-upload-service";
import {
  generateLesson,
  getLessonDetail,
  LessonGenerationError,
} from "./services/lesson-generation-service";
import { bootstrapGuestSession } from "./services/guest-session-service";
import {
  generateQuiz,
  getQuizAttemptDetail,
  getQuizDetail,
  QuizGenerationError,
  submitQuiz,
} from "./services/quiz-generation-service";
import {
  getOrCreateTeacherThread,
  getTeacherThreadDetail,
  sendTeacherMessage,
  TeacherConversationError,
} from "./services/teacher-conversation-service";

type AppEnvironment = { Bindings: Env };

const app = new Hono<AppEnvironment>();

const errorResponse = (
  code: ApiErrorResponse["error"]["code"],
  message: string,
): ApiErrorResponse => ({ error: { code, message } });

const logOperationalError = (operation: string, error: unknown) => {
  console.error(
    JSON.stringify({
      event: "operation_failed",
      operation,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error ? error.message : "Unknown database error",
    }),
  );
};

const internalErrorResponse = () =>
  errorResponse("INTERNAL_ERROR", "İşlem şu anda tamamlanamadı.");

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 86_400,
  }),
);

app.get("/", (context) => {
  const response = {
    name: "Anlat Hoca API",
    status: "ok",
  } satisfies ApiInfoResponse;

  return context.json(response);
});

app.get("/health", async (context) => {
  try {
    await assertDatabaseAvailable(context.env.DB);
    const response = { status: "healthy" } satisfies ApiHealthResponse;
    return context.json(response);
  } catch (error) {
    logOperationalError("database_health", error);
    return context.json(internalErrorResponse(), 503);
  }
});

app.post(
  "/session",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    let body: unknown;

    try {
      body = await context.req.json();
    } catch {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const result = guestSessionRequestSchema.safeParse(body);

    if (!result.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const repository = new D1InstallationRepository(context.env.DB);
      const response = await bootstrapGuestSession(
        repository,
        result.data.installationId,
      );

      return context.json(response satisfies GuestSessionResponse);
    } catch (error) {
      logOperationalError("guest_installation_touch", error);
      return context.json(internalErrorResponse(), 500);
    }
  },
);

app.post(
  "/documents/upload",
  bodyLimit({
    maxSize: MAX_PDF_UPLOAD_BODY_BYTES,
    onError: (context) =>
      context.json(
        errorResponse(
          "FILE_TOO_LARGE",
          "Bu dosya 15 MB sınırını aşıyor.",
        ),
        413,
      ),
  }),
  async (context) => {
    const contentType = context.req.header("Content-Type") ?? "";

    if (
      !contentType
        .toLocaleLowerCase("en-US")
        .startsWith("multipart/form-data;")
    ) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    let body: Awaited<ReturnType<typeof context.req.parseBody>>;

    try {
      body = await context.req.parseBody({ all: true });
    } catch {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    if (
      Object.keys(body).some(
        (key) => key !== "installationId" && key !== "file",
      )
    ) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const installationValues = toFormValues(body.installationId);
    const fileValues = toFormValues(body.file);
    const installationId = installationValues[0];
    const file = fileValues[0];

    if (
      installationValues.length !== 1 ||
      typeof installationId !== "string" ||
      fileValues.length !== 1 ||
      !(file instanceof File)
    ) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const apiKey = context.env.GEMINI_API_KEY?.trim();
    const fileProvider = apiKey ? new GeminiFilesProvider(apiKey) : undefined;

    try {
      const response = await uploadDocument({
        installationId,
        file,
        installationRepository: new D1InstallationRepository(context.env.DB),
        documentRepository: new D1DocumentRepository(context.env.DB),
        fileProvider,
      });

      return context.json(response, 201);
    } catch (error) {
      if (error instanceof DocumentUploadError) {
        if (error.status >= 500 && error.code !== "AI_NOT_CONFIGURED") {
          logOperationalError("document_upload", error);
        }

        return context.json(
          errorResponse(error.code, error.publicMessage),
          error.status,
        );
      }

      logOperationalError("document_upload", error);
      return context.json(internalErrorResponse(), 500);
    }
  },
);

app.post(
  "/documents/:documentId/analyze",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const request = await readAnalysisRequest(context.req.raw);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const apiKey = context.env.GEMINI_API_KEY?.trim();
    const provider = apiKey
      ? new GeminiDocumentAnalysisProvider(
          apiKey,
          resolveGeminiAnalysisModel(context.env.GEMINI_ANALYSIS_MODEL),
        )
      : undefined;

    try {
      const response = await analyzeDocument({
        documentId: context.req.param("documentId"),
        installationId: request.data.installationId,
        documentRepository: new D1DocumentRepository(context.env.DB),
        analysisRepository: new D1DocumentAnalysisRepository(context.env.DB),
        analysisProvider: provider,
      });

      return context.json(response);
    } catch (error) {
      return handleAnalysisError(context, error, "document_analyze");
    }
  },
);

app.post(
    "/documents/:documentId/analysis",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const request = await readAnalysisRequest(context.req.raw);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const response = await getStoredDocumentAnalysis({
        documentId: context.req.param("documentId"),
        installationId: request.data.installationId,
        documentRepository: new D1DocumentRepository(context.env.DB),
        analysisRepository: new D1DocumentAnalysisRepository(context.env.DB),
      });

      return context.json(response);
    } catch (error) {
      return handleAnalysisError(context, error, "document_analysis_read");
    }
  },
);

app.post(
  "/documents/:documentId/lessons",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const request = lessonGenerationRequestSchema.safeParse(body);

    if (!request.success) {
      if (hasOnlyLessonRequestKeys(body) && hasValidInstallationId(body)) {
        const duration = lessonDurationSchema.safeParse(body.durationMinutes);

        if (!duration.success) {
          return context.json(
            errorResponse(
              "INVALID_LESSON_DURATION",
              "Çalışma süresi 10, 30 veya 60 dakika olmalıdır.",
            ),
            400,
          );
        }
      }

      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const model = resolveGeminiLessonModel(context.env.GEMINI_LESSON_MODEL);
    const apiKey = context.env.GEMINI_API_KEY?.trim();
    const provider = apiKey
      ? new GeminiLessonGenerationProvider(apiKey, model)
      : undefined;

    try {
      const result = await generateLesson({
        documentId: context.req.param("documentId"),
        installationId: request.data.installationId,
        durationMinutes: request.data.durationMinutes,
        model,
        documentRepository: new D1DocumentRepository(context.env.DB),
        analysisRepository: new D1DocumentAnalysisRepository(context.env.DB),
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
        lessonProvider: provider,
      });

      return result.created
        ? context.json(result.response, 201)
        : context.json(result.response, 200);
    } catch (error) {
      return handleLessonError(context, error, "lesson_generate");
    }
  },
);

app.post(
  "/lessons/:lessonId/detail",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const request = lessonDetailRequestSchema.safeParse(body);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const response = await getLessonDetail({
        lessonId: context.req.param("lessonId"),
        installationId: request.data.installationId,
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
      });

      return context.json(response);
    } catch (error) {
      return handleLessonError(context, error, "lesson_detail");
    }
  },
);

app.post(
  "/lessons/:lessonId/teacher/thread",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const request = teacherThreadRequestSchema.safeParse(body);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const response = await getOrCreateTeacherThread({
        lessonId: context.req.param("lessonId"),
        installationId: request.data.installationId,
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
        threadRepository: new D1TeacherThreadRepository(context.env.DB),
        messageRepository: new D1TeacherMessageRepository(context.env.DB),
      });

      return context.json(response);
    } catch (error) {
      return handleTeacherError(context, error, "teacher_thread_open");
    }
  },
);

app.post(
  "/lessons/:lessonId/teacher/messages",
  bodyLimit({
    maxSize: 4_096,
    onError: (context) =>
      context.json(
        errorResponse(
          "INVALID_TEACHER_MESSAGE",
          "Sorunu 1–1200 karakter arasında yazarak tekrar dene.",
        ),
        400,
      ),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const model = resolveGeminiTeacherModel(
      context.env.GEMINI_TEACHER_MODEL,
    );
    const apiKey = context.env.GEMINI_API_KEY?.trim();
    const provider = apiKey
      ? new GeminiTeacherAnswerProvider(apiKey, model)
      : undefined;

    try {
      const response = await sendTeacherMessage({
        lessonId: context.req.param("lessonId"),
        body,
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
        threadRepository: new D1TeacherThreadRepository(context.env.DB),
        messageRepository: new D1TeacherMessageRepository(context.env.DB),
        teacherProvider: provider,
      });

      return context.json(response, 201);
    } catch (error) {
      return handleTeacherError(context, error, "teacher_message_send");
    }
  },
);

app.post(
  "/teacher-threads/:threadId/detail",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const request = teacherThreadRequestSchema.safeParse(body);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const response = await getTeacherThreadDetail({
        threadId: context.req.param("threadId"),
        installationId: request.data.installationId,
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
        threadRepository: new D1TeacherThreadRepository(context.env.DB),
        messageRepository: new D1TeacherMessageRepository(context.env.DB),
      });

      return context.json(response);
    } catch (error) {
      return handleTeacherError(context, error, "teacher_thread_detail");
    }
  },
);

app.post(
  "/lessons/:lessonId/quiz",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const request = generateQuizRequestSchema.safeParse(body);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const model = resolveGeminiQuizModel(context.env.GEMINI_QUIZ_MODEL);
    const apiKey = context.env.GEMINI_API_KEY?.trim();
    const provider = apiKey
      ? new GeminiQuizGenerationProvider(apiKey, model)
      : undefined;

    try {
      const result = await generateQuiz({
        lessonId: context.req.param("lessonId"),
        installationId: request.data.installationId,
        model,
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
        quizRepository: new D1LessonQuizRepository(context.env.DB),
        quizProvider: provider,
      });

      return result.created
        ? context.json(result.response, 201)
        : context.json(result.response, 200);
    } catch (error) {
      return handleQuizError(context, error, "quiz_generate");
    }
  },
);

app.post(
  "/quizzes/:quizId/detail",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const request = generateQuizRequestSchema.safeParse(body);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const response = await getQuizDetail({
        quizId: context.req.param("quizId"),
        installationId: request.data.installationId,
        quizRepository: new D1LessonQuizRepository(context.env.DB),
      });

      return context.json(response);
    } catch (error) {
      return handleQuizError(context, error, "quiz_detail");
    }
  },
);

app.post(
  "/quizzes/:quizId/submit",
  bodyLimit({
    maxSize: 8_192,
    onError: (context) =>
      context.json(
        errorResponse(
          "INVALID_QUIZ_SUBMISSION",
          "Cevaplar gönderilemedi. Lütfen tüm soruları yanıtlayıp tekrar dene.",
        ),
        400,
      ),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);

    try {
      const response = await submitQuiz({
        quizId: context.req.param("quizId"),
        body,
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
        quizRepository: new D1LessonQuizRepository(context.env.DB),
        attemptRepository: new D1QuizAttemptRepository(context.env.DB),
      });

      return context.json(response, 201);
    } catch (error) {
      return handleQuizError(context, error, "quiz_submit");
    }
  },
);

app.post(
  "/quiz-attempts/:attemptId/detail",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    const body = await readJsonBody(context.req.raw);
    const request = generateQuizRequestSchema.safeParse(body);

    if (!request.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const response = await getQuizAttemptDetail({
        attemptId: context.req.param("attemptId"),
        installationId: request.data.installationId,
        lessonRepository: new D1DocumentLessonRepository(context.env.DB),
        quizRepository: new D1LessonQuizRepository(context.env.DB),
        attemptRepository: new D1QuizAttemptRepository(context.env.DB),
      });

      return context.json(response);
    } catch (error) {
      return handleQuizError(context, error, "quiz_attempt_detail");
    }
  },
);

app.all("/session", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.all("/documents/upload", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.all("/documents/:documentId/analyze", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.all("/documents/:documentId/analysis", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.all("/documents/:documentId/lessons", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.all("/lessons/:lessonId/detail", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.all("/lessons/:lessonId/quiz", methodNotAllowed);
app.all("/lessons/:lessonId/teacher/thread", methodNotAllowed);
app.all("/lessons/:lessonId/teacher/messages", methodNotAllowed);
app.all("/teacher-threads/:threadId/detail", methodNotAllowed);
app.all("/quizzes/:quizId/detail", methodNotAllowed);
app.all("/quizzes/:quizId/submit", methodNotAllowed);
app.all("/quiz-attempts/:attemptId/detail", methodNotAllowed);

app.notFound((context) =>
  context.json(errorResponse("NOT_FOUND", "Kaynak bulunamadı."), 404),
);

app.onError((error, context) => {
  logOperationalError("unhandled_request", error);
  return context.json(internalErrorResponse(), 500);
});

export default app;

function toFormValues(
  value: string | File | (string | File)[] | undefined,
): (string | File)[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

async function readAnalysisRequest(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { success: false } as const;
  }

  return analyzeDocumentRequestSchema.safeParse(body);
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function hasOnlyLessonRequestKeys(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).every(
      (key) => key === "installationId" || key === "durationMinutes",
    )
  );
}

function hasValidInstallationId(value: Record<string, unknown>): boolean {
  return installationIdSchema.safeParse(value.installationId).success;
}

function handleAnalysisError(
  context: Context<AppEnvironment>,
  error: unknown,
  operation: string,
) {
  if (error instanceof DocumentAnalysisError) {
    if (error.status >= 500 && error.code !== "AI_NOT_CONFIGURED") {
      logOperationalError(operation, error);
    }

    return context.json(
      errorResponse(error.code, error.publicMessage),
      error.status,
    );
  }

  logOperationalError(operation, error);
  return context.json(internalErrorResponse(), 500);
}

function handleLessonError(
  context: Context<AppEnvironment>,
  error: unknown,
  operation: string,
) {
  if (error instanceof LessonGenerationError) {
    if (error.status >= 500 && error.code !== "AI_NOT_CONFIGURED") {
      logOperationalError(operation, error);
    }

    return context.json(
      errorResponse(error.code, error.publicMessage),
      error.status,
    );
  }

  logOperationalError(operation, error);
  return context.json(internalErrorResponse(), 500);
}

function handleQuizError(
  context: Context<AppEnvironment>,
  error: unknown,
  operation: string,
) {
  if (error instanceof QuizGenerationError) {
    if (error.status >= 500 && error.code !== "AI_NOT_CONFIGURED") {
      logOperationalError(operation, error);
    }

    return context.json(
      errorResponse(error.code, error.publicMessage),
      error.status,
    );
  }

  logOperationalError(operation, error);
  return context.json(internalErrorResponse(), 500);
}

function handleTeacherError(
  context: Context<AppEnvironment>,
  error: unknown,
  operation: string,
) {
  if (error instanceof TeacherConversationError) {
    if (error.status >= 500 && error.code !== "AI_NOT_CONFIGURED") {
      logOperationalError(operation, error);
    }

    return context.json(
      errorResponse(error.code, error.publicMessage),
      error.status,
    );
  }

  logOperationalError(operation, error);
  return context.json(internalErrorResponse(), 500);
}

function methodNotAllowed(context: Context<AppEnvironment>) {
  return context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  );
}
