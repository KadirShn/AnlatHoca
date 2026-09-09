import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Lesson } from "@anlat-hoca/contracts";

import type {
  DocumentLessonRepository,
  StoredLesson,
} from "../data/document-lesson-repository";
import type {
  AppendTeacherExchangeInput,
  StoredTeacherMessage,
  TeacherMessageRepository,
} from "../data/teacher-message-repository";
import type {
  StoredTeacherThread,
  TeacherThreadRepository,
} from "../data/teacher-thread-repository";
import {
  TeacherAnswerProviderError,
  type GeneratedTeacherAnswer,
  type TeacherAnswerProvider,
} from "../providers/ai/teacher-answer-provider";
import {
  getOrCreateTeacherThread,
  sendTeacherMessage,
  TeacherConversationError,
} from "./teacher-conversation-service";

const installationId = "550e8400-e29b-41d4-a716-446655440000";
const lessonId = "550e8400-e29b-41d4-a716-446655440001";
const documentId = "550e8400-e29b-41d4-a716-446655440002";
const threadId = "550e8400-e29b-41d4-a716-446655440003";
const assistantId = "550e8400-e29b-41d4-a716-446655440004";
const createdAt = "2026-09-09T08:00:00.000Z";

const lesson: Lesson = {
  id: lessonId,
  documentId,
  durationMinutes: 10,
  title: "Hücreye Giriş",
  overview: "Hücrenin temel yapılarını tanıtan kısa bir ders.",
  learningObjectives: ["Hücreyi tanımlamak", "Organelleri ayırt etmek"],
  sections: [
    {
      title: "Hücrenin Yapısı",
      estimatedMinutes: 10,
      explanation:
        "Hücre, canlıların temel yapı ve işlev birimidir. Hücre zarı madde alışverişini düzenler; sitoplazma ise birçok yaşamsal tepkimenin gerçekleştiği ortamdır.",
      keyPoints: ["Temel yapı birimidir", "Hücre zarı seçici geçirgendir"],
      memoryTip: "Zar sınırı, sitoplazma çalışma alanını temsil eder.",
    },
  ],
  recap: ["Hücre temel birimdir", "Zar alışverişi düzenler", "Sitoplazma tepkime ortamıdır"],
  skippedTopics: ["Mitokondri ayrıntıları"],
};

const storedLesson: StoredLesson = {
  ...lesson,
  status: "ready",
  updatedAt: createdAt,
};

const thread: StoredTeacherThread = {
  id: threadId,
  lessonId,
  installationId,
  createdAt,
  updatedAt: createdAt,
};

describe("teacher conversation service", () => {
  it("uses at most six recent turns and explicitly refuses unsupported grounding", async () => {
    let capturedPrompt = "";
    let requestedMaximum = 0;
    const messages = Array.from({ length: 14 }, (_, index) =>
      storedMessage(index + 1),
    );
    const dependencies = createDependencies({
      recentMessages: messages,
      onRecentMaximum: (maximum) => {
        requestedMaximum = maximum;
      },
    });
    const provider = createProvider(async ({ prompt }) => {
      capturedPrompt = prompt;
      return validAnswer();
    });

    await sendTeacherMessage({
      ...dependencies,
      lessonId,
      body: { installationId, message: "Hücre nedir?" },
      teacherProvider: provider,
      now: new Date(createdAt),
    });

    assert.equal(requestedMaximum, 12);
    assert.match(capturedPrompt, /Sorunun yanıtı ders içeriğinde yoksa/);
    assert.match(capturedPrompt, /topicsNotIncludedInLesson/);
    assert.match(capturedPrompt, /Mitokondri ayrıntıları/);
  });

  it("rejects an out-of-range related section before persisting", async () => {
    let appendCount = 0;
    const dependencies = createDependencies({
      onAppend: () => {
        appendCount += 1;
      },
    });
    const provider = createProvider(async () => ({
      ...validAnswer(),
      relatedSectionIndexes: [4],
    }));

    await assert.rejects(
      sendTeacherMessage({
        ...dependencies,
        lessonId,
        body: { installationId, message: "Hücre nedir?" },
        teacherProvider: provider,
      }),
      (error: unknown) =>
        error instanceof TeacherConversationError &&
        error.code === "TEACHER_RESPONSE_FAILED",
    );
    assert.equal(appendCount, 0);
  });

  it("enforces the daily limit without invoking the provider", async () => {
    let providerCalls = 0;
    const dependencies = createDependencies({ dailyCount: 30 });
    const provider = createProvider(async () => {
      providerCalls += 1;
      return validAnswer();
    });

    await assert.rejects(
      sendTeacherMessage({
        ...dependencies,
        lessonId,
        body: { installationId, message: "Hücre nedir?" },
        teacherProvider: provider,
      }),
      (error: unknown) =>
        error instanceof TeacherConversationError &&
        error.code === "USAGE_LIMIT_REACHED",
    );
    assert.equal(providerCalls, 0);
  });

  it("loads persisted history without an AI dependency", async () => {
    const history = [storedMessage(1), storedMessage(2)];
    const response = await getOrCreateTeacherThread({
      ...createDependencies({ allMessages: history }),
      lessonId,
      installationId,
    });

    assert.equal(response.thread.messages.length, 2);
    assert.equal(response.thread.messages[0].role, "user");
    assert.equal(response.thread.messages[1].role, "assistant");
  });

  it("uses a generic lesson not-found result for another installation", async () => {
    const dependencies = createDependencies({ ownedLesson: null });

    await assert.rejects(
      getOrCreateTeacherThread({
        ...dependencies,
        lessonId,
        installationId,
      }),
      (error: unknown) =>
        error instanceof TeacherConversationError &&
        error.code === "LESSON_NOT_FOUND",
    );
  });

  it("leaves no message pair after provider failure", async () => {
    let appendCount = 0;
    const dependencies = createDependencies({
      onAppend: () => {
        appendCount += 1;
      },
    });
    const provider = createProvider(async () => {
      throw new TeacherAnswerProviderError("upstream");
    });

    await assert.rejects(
      sendTeacherMessage({
        ...dependencies,
        lessonId,
        body: { installationId, message: "Hücre nedir?" },
        teacherProvider: provider,
      }),
      (error: unknown) =>
        error instanceof TeacherConversationError &&
        error.code === "TEACHER_RESPONSE_FAILED",
    );
    assert.equal(appendCount, 0);
  });
});

function createDependencies(options?: {
  allMessages?: StoredTeacherMessage[];
  dailyCount?: number;
  onAppend?: () => void;
  onRecentMaximum?: (maximum: number) => void;
  ownedLesson?: StoredLesson | null;
  recentMessages?: StoredTeacherMessage[];
}) {
  const lessonRepository = {
    findByIdForInstallation: async () =>
      options?.ownedLesson === undefined ? storedLesson : options.ownedLesson,
  } as unknown as DocumentLessonRepository;
  const threadRepository: TeacherThreadRepository = {
    findOrCreate: async () => thread,
    findByIdForInstallation: async () => thread,
  };
  const messageRepository: TeacherMessageRepository = {
    listAll: async () => options?.allMessages ?? [],
    listRecent: async (_threadId, maximum) => {
      options?.onRecentMaximum?.(maximum);
      return (options?.recentMessages ?? []).slice(-maximum);
    },
    countUserMessagesForInstallation: async () => options?.dailyCount ?? 0,
    appendExchange: async (input) => {
      options?.onAppend?.();
      return storedAssistantFromInput(input);
    },
  };

  return { lessonRepository, threadRepository, messageRepository };
}

function createProvider(
  generateAnswer: TeacherAnswerProvider["generateAnswer"],
): TeacherAnswerProvider {
  return { model: "gemini-test", generateAnswer };
}

function validAnswer(): GeneratedTeacherAnswer {
  return {
    answer: "Hücre, canlıların temel yapı ve işlev birimidir.",
    relatedSectionIndexes: [0],
    suggestedFollowUps: ["Hücre zarının görevi nedir?"],
  };
}

function storedMessage(sequence: number): StoredTeacherMessage {
  const assistant = sequence % 2 === 0;
  return {
    id: `550e8400-e29b-41d4-a716-${String(446655440000 + sequence).padStart(12, "0")}`,
    threadId,
    sequence,
    role: assistant ? "assistant" : "user",
    content: assistant ? "Derse dayalı yanıt." : "Önceki soru?",
    relatedSections: assistant
      ? [{ sectionIndex: 0, title: lesson.sections[0].title }]
      : null,
    suggestedFollowUps: assistant ? [] : null,
    promptVersion: assistant ? "v1" : null,
    model: assistant ? "gemini-test" : null,
    createdAt,
  };
}

function storedAssistantFromInput(
  input: AppendTeacherExchangeInput,
): StoredTeacherMessage {
  return {
    id: input.assistantMessageId || assistantId,
    threadId: input.threadId,
    sequence: 2,
    role: "assistant",
    content: input.assistantContent,
    relatedSections: input.relatedSections,
    suggestedFollowUps: input.suggestedFollowUps,
    promptVersion: input.promptVersion,
    model: input.model,
    createdAt: input.createdAt,
  };
}
