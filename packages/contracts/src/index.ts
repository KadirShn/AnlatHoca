import { z } from "zod";

export const apiHealthResponseSchema = z
  .object({ status: z.literal("healthy") })
  .strict();

export type ApiHealthResponse = z.infer<typeof apiHealthResponseSchema>;

export const apiInfoResponseSchema = z
  .object({ name: z.literal("Anlat Hoca API"), status: z.literal("ok") })
  .strict();

export type ApiInfoResponse = z.infer<typeof apiInfoResponseSchema>;

export const installationIdSchema = z.string().uuid();

export const guestSessionRequestSchema = z
  .object({ installationId: installationIdSchema })
  .strict();

export type GuestSessionRequest = z.infer<typeof guestSessionRequestSchema>;

export const guestSessionResponseSchema = z
  .object({
    installationId: installationIdSchema,
    sessionType: z.literal("guest"),
    status: z.literal("ready"),
  })
  .strict();

export type GuestSessionResponse = z.infer<typeof guestSessionResponseSchema>;

export const documentIdSchema = z.string().uuid();

export const uploadedDocumentSchema = z
  .object({
    id: documentIdSchema,
    name: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    mimeType: z.literal("application/pdf"),
    status: z.literal("uploaded"),
  })
  .strict();

export type UploadedDocument = z.infer<typeof uploadedDocumentSchema>;

export const documentUploadResponseSchema = z
  .object({ document: uploadedDocumentSchema })
  .strict();

export type DocumentUploadResponse = z.infer<
  typeof documentUploadResponseSchema
>;

const boundedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

export const analysisTopicSchema = z
  .object({
    title: boundedText(1, 120),
    summary: boundedText(1, 500),
    importance: z.number().int().min(1).max(5),
    difficulty: z.number().int().min(1).max(5),
    keyPoints: z.array(boundedText(1, 240)).min(2).max(6),
  })
  .strict();

export type AnalysisTopic = z.infer<typeof analysisTopicSchema>;

export const documentAnalysisSchema = z
  .object({
    title: boundedText(1, 160),
    summary: boundedText(1, 1_200),
    topics: z.array(analysisTopicSchema).min(1).max(25),
  })
  .strict();

export type DocumentAnalysis = z.infer<typeof documentAnalysisSchema>;

export const analyzeDocumentRequestSchema = z
  .object({ installationId: installationIdSchema })
  .strict();

export type AnalyzeDocumentRequest = z.infer<
  typeof analyzeDocumentRequestSchema
>;

export const analyzedDocumentSchema = z
  .object({
    id: documentIdSchema,
    status: z.literal("analyzed"),
  })
  .strict();

export const analyzeDocumentResponseSchema = z
  .object({
    document: analyzedDocumentSchema,
    analysis: documentAnalysisSchema,
  })
  .strict();

export type AnalyzeDocumentResponse = z.infer<
  typeof analyzeDocumentResponseSchema
>;

export const lessonDurationSchema = z.union([
  z.literal(10),
  z.literal(30),
  z.literal(60),
]);

export type LessonDuration = z.infer<typeof lessonDurationSchema>;

export const lessonDurationMinuteRanges = {
  10: [8, 12],
  30: [26, 34],
  60: [54, 66],
} as const satisfies Record<LessonDuration, readonly [number, number]>;

export const lessonSectionSchema = z
  .object({
    title: boundedText(1, 120),
    estimatedMinutes: z.number().int().min(1).max(30),
    explanation: boundedText(80, 2_400),
    keyPoints: z.array(boundedText(1, 240)).min(2).max(6),
    memoryTip: boundedText(1, 300).optional(),
  })
  .strict();

export type LessonSection = z.infer<typeof lessonSectionSchema>;

export const lessonContentSchema = z
  .object({
    title: boundedText(1, 160),
    overview: boundedText(1, 1_000),
    learningObjectives: z.array(boundedText(1, 240)).min(2).max(6),
    sections: z.array(lessonSectionSchema).min(1).max(12),
    recap: z.array(boundedText(1, 240)).min(3).max(10),
    skippedTopics: z.array(boundedText(1, 240)).max(10),
  })
  .strict();

export type LessonContent = z.infer<typeof lessonContentSchema>;

export const lessonIdSchema = z.string().uuid();

export const lessonSchema = lessonContentSchema
  .extend({
    id: lessonIdSchema,
    documentId: documentIdSchema,
    durationMinutes: lessonDurationSchema,
  })
  .strict()
  .superRefine((lesson, context) => {
    const total = lesson.sections.reduce(
      (sum, section) => sum + section.estimatedMinutes,
      0,
    );
    const [minimum, maximum] =
      lessonDurationMinuteRanges[lesson.durationMinutes];

    if (total < minimum || total > maximum) {
      context.addIssue({
        code: "custom",
        message: "Section minutes do not match the requested lesson duration.",
        path: ["sections"],
      });
    }
  });

export type Lesson = z.infer<typeof lessonSchema>;

export const lessonGenerationRequestSchema = z
  .object({
    installationId: installationIdSchema,
    durationMinutes: lessonDurationSchema,
  })
  .strict();

export type LessonGenerationRequest = z.infer<
  typeof lessonGenerationRequestSchema
>;

export const lessonGenerationResponseSchema = z
  .object({ lesson: lessonSchema })
  .strict();

export type LessonGenerationResponse = z.infer<
  typeof lessonGenerationResponseSchema
>;

export const lessonDetailRequestSchema = z
  .object({ installationId: installationIdSchema })
  .strict();

export type LessonDetailRequest = z.infer<typeof lessonDetailRequestSchema>;

export const lessonDetailResponseSchema = z
  .object({ lesson: lessonSchema })
  .strict();

export type LessonDetailResponse = z.infer<
  typeof lessonDetailResponseSchema
>;

export const quizIdSchema = z.string().uuid();
export const quizAttemptIdSchema = z.string().uuid();
export const quizOptionIndexSchema = z.number().int().min(0).max(3);

const quizOptionsSchema = z.tuple([
  boundedText(1, 240),
  boundedText(1, 240),
  boundedText(1, 240),
  boundedText(1, 240),
]);

export const publicQuizQuestionSchema = z
  .object({
    id: z.string().uuid(),
    question: boundedText(10, 500),
    options: quizOptionsSchema,
  })
  .strict();

export type PublicQuizQuestion = z.infer<typeof publicQuizQuestionSchema>;

export const publicQuizSchema = z
  .object({
    id: quizIdSchema,
    lessonId: lessonIdSchema,
    title: boundedText(1, 120),
    questions: z.array(publicQuizQuestionSchema).min(1).max(10),
  })
  .strict();

export type PublicQuiz = z.infer<typeof publicQuizSchema>;

export const generateQuizRequestSchema = z
  .object({ installationId: installationIdSchema })
  .strict();

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;

export const generateQuizResponseSchema = z
  .object({ quiz: publicQuizSchema })
  .strict();

export type GenerateQuizResponse = z.infer<typeof generateQuizResponseSchema>;

export const quizDetailRequestSchema = generateQuizRequestSchema;
export type QuizDetailRequest = GenerateQuizRequest;

export const quizDetailResponseSchema = generateQuizResponseSchema;
export type QuizDetailResponse = GenerateQuizResponse;

export const quizSubmissionAnswerSchema = z
  .object({
    questionId: z.string().uuid(),
    selectedOptionIndex: quizOptionIndexSchema,
  })
  .strict();

export type QuizSubmissionAnswer = z.infer<
  typeof quizSubmissionAnswerSchema
>;

export const quizSubmissionRequestSchema = z
  .object({
    installationId: installationIdSchema,
    answers: z.array(quizSubmissionAnswerSchema).min(1).max(10),
  })
  .strict();

export type QuizSubmissionRequest = z.infer<
  typeof quizSubmissionRequestSchema
>;

export const gradedQuizQuestionSchema = z
  .object({
    questionId: z.string().uuid(),
    question: boundedText(10, 500),
    options: quizOptionsSchema,
    selectedOptionIndex: quizOptionIndexSchema,
    correctOptionIndex: quizOptionIndexSchema,
    isCorrect: z.boolean(),
    explanation: boundedText(20, 700),
    sourceSectionIndex: z.number().int().nonnegative(),
  })
  .strict();

export type GradedQuizQuestion = z.infer<
  typeof gradedQuizQuestionSchema
>;

export const weakQuizSectionSchema = z
  .object({
    sectionIndex: z.number().int().nonnegative(),
    title: boundedText(1, 120),
    wrongAnswers: z.number().int().positive().max(10),
  })
  .strict();

export type WeakQuizSection = z.infer<typeof weakQuizSectionSchema>;

export const quizAttemptResultSchema = z
  .object({
    id: quizAttemptIdSchema,
    quizId: quizIdSchema,
    lessonId: lessonIdSchema,
    correctCount: z.number().int().nonnegative().max(10),
    totalQuestions: z.number().int().positive().max(10),
    scorePercent: z.number().int().min(0).max(100),
    questions: z.array(gradedQuizQuestionSchema).min(1).max(10),
    weakSections: z.array(weakQuizSectionSchema).max(12),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type QuizAttemptResult = z.infer<typeof quizAttemptResultSchema>;

export const quizSubmissionResponseSchema = z
  .object({ attempt: quizAttemptResultSchema })
  .strict();

export type QuizSubmissionResponse = z.infer<
  typeof quizSubmissionResponseSchema
>;

export const quizAttemptDetailRequestSchema = generateQuizRequestSchema;
export type QuizAttemptDetailRequest = GenerateQuizRequest;

export const quizAttemptDetailResponseSchema = quizSubmissionResponseSchema;
export type QuizAttemptDetailResponse = QuizSubmissionResponse;

export const teacherThreadIdSchema = z.string().uuid();
export const teacherMessageIdSchema = z.string().uuid();
export const teacherMessageRoleSchema = z.enum(["user", "assistant"]);

export const teacherRelatedSectionSchema = z
  .object({
    sectionIndex: z.number().int().nonnegative(),
    title: boundedText(1, 120),
  })
  .strict();

export type TeacherRelatedSection = z.infer<
  typeof teacherRelatedSectionSchema
>;

export const teacherMessageSchema = z
  .object({
    id: teacherMessageIdSchema,
    role: teacherMessageRoleSchema,
    content: boundedText(1, 3_000),
    relatedSections: z.array(teacherRelatedSectionSchema).max(3),
    suggestedFollowUps: z.array(boundedText(1, 180)).max(3),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type TeacherMessage = z.infer<typeof teacherMessageSchema>;

export const teacherThreadSchema = z
  .object({
    id: teacherThreadIdSchema,
    lessonId: lessonIdSchema,
    lessonTitle: boundedText(1, 160),
    messages: z.array(teacherMessageSchema),
  })
  .strict();

export type TeacherThread = z.infer<typeof teacherThreadSchema>;

export const teacherThreadRequestSchema = z
  .object({ installationId: installationIdSchema })
  .strict();

export type TeacherThreadRequest = z.infer<
  typeof teacherThreadRequestSchema
>;

export const teacherThreadResponseSchema = z
  .object({ thread: teacherThreadSchema })
  .strict();

export type TeacherThreadResponse = z.infer<
  typeof teacherThreadResponseSchema
>;

export const teacherMessageRequestSchema = z
  .object({
    installationId: installationIdSchema,
    message: boundedText(1, 1_200),
  })
  .strict();

export type TeacherMessageRequest = z.infer<
  typeof teacherMessageRequestSchema
>;

export const teacherMessageResponseSchema = z
  .object({
    threadId: teacherThreadIdSchema,
    userMessage: teacherMessageSchema,
    message: teacherMessageSchema,
  })
  .strict();

export type TeacherMessageResponse = z.infer<
  typeof teacherMessageResponseSchema
>;

export const apiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_FILE",
  "AI_NOT_CONFIGURED",
  "UPSTREAM_ERROR",
  "DOCUMENT_NOT_FOUND",
  "DOCUMENT_EXPIRED",
  "ANALYSIS_NOT_FOUND",
  "ANALYSIS_FAILED",
  "ANALYSIS_IN_PROGRESS",
  "ANALYSIS_REQUIRED",
  "INVALID_LESSON_DURATION",
  "LESSON_NOT_FOUND",
  "LESSON_GENERATION_FAILED",
  "LESSON_IN_PROGRESS",
  "QUIZ_NOT_FOUND",
  "QUIZ_ATTEMPT_NOT_FOUND",
  "QUIZ_GENERATION_FAILED",
  "QUIZ_IN_PROGRESS",
  "INVALID_QUIZ_SUBMISSION",
  "TEACHER_THREAD_NOT_FOUND",
  "INVALID_TEACHER_MESSAGE",
  "TEACHER_RESPONSE_FAILED",
  "USAGE_LIMIT_REACHED",
  "METHOD_NOT_ALLOWED",
  "NOT_FOUND",
  "INTERNAL_ERROR",
]);

export const apiErrorResponseSchema = z
  .object({
    error: z
      .object({
        code: apiErrorCodeSchema,
        message: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
