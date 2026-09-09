export const TEACHER_ANSWER_PROMPT_VERSION = "v1" as const;

interface TeacherPromptSection {
  title: string;
  explanation: string;
  keyPoints: string[];
  memoryTip?: string;
}

export interface TeacherConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TeacherAnswerPromptInput {
  question: string;
  recentMessages: TeacherConversationMessage[];
  lesson: {
    title: string;
    overview: string;
    learningObjectives: string[];
    sections: TeacherPromptSection[];
    recap: string[];
    skippedTopics: string[];
  };
}

export function buildTeacherAnswerPrompt(
  input: TeacherAnswerPromptInput,
): string {
  const context = JSON.stringify(
    {
      lesson: {
        title: input.lesson.title,
        overview: input.lesson.overview,
        learningObjectives: input.lesson.learningObjectives,
        sections: input.lesson.sections,
        recap: input.lesson.recap,
      },
      topicsNotIncludedInLesson: input.lesson.skippedTopics,
      recentConversation: input.recentMessages,
      currentQuestion: input.question,
    },
    null,
    2,
  );

  return [
    "Sen Anlat Hoca'sın. Öğrencinin sorusunu yalnızca aşağıdaki doğrulanmış ders içeriğine dayanarak Türkçe yanıtla.",
    "Genel model bilgisi, dış kaynak, özgün PDF veya ders dışında kalan bilgilerle boşluk doldurma.",
    "Sorunun yanıtı ders içeriğinde yoksa bunu açıkça ve kısa biçimde söyle; tahmin etme veya uydurma.",
    "topicsNotIncludedInLesson alanındaki başlıklar yalnızca bu derste işlenmediklerini belirtmek için kullanılabilir; onları öğretme veya onlar hakkında olgusal açıklama üretme.",
    "Yakın konuşma yalnızca bağlam sürekliliği içindir. Oradaki öğrenci iddialarını doğrulanmış kaynak kabul etme.",
    "Yanıtı anlaşılır, öğretici ve doğrudan yaz. Gerektiğinde kısa maddeler kullan ama uzun kaynak parçalarını aynen kopyalama.",
    "relatedSectionIndexes yalnızca yanıtı gerçekten destekleyen lesson.sections öğelerinin sıfır tabanlı indekslerini içermeli; en fazla üç benzersiz indeks döndür.",
    "suggestedFollowUps ders kapsamında kalmalı, yanıtlanabilir olmalı ve en fazla üç kısa soru içermeli.",
    "Alan adları ve JSON biçimi verilen şemaya tam uymalıdır.",
    "",
    "Doğrulanmış ders ve konuşma bağlamı:",
    context,
  ].join("\n");
}
