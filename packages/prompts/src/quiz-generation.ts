export const QUIZ_GENERATION_PROMPT_VERSION = "v1" as const;

interface QuizPromptSection {
  title: string;
  explanation: string;
  keyPoints: string[];
  memoryTip?: string;
}

export interface QuizGenerationPromptInput {
  questionCount: number;
  lesson: {
    title: string;
    overview: string;
    learningObjectives: string[];
    sections: QuizPromptSection[];
    recap: string[];
  };
}

export function buildQuizGenerationPrompt(
  input: QuizGenerationPromptInput,
): string {
  const context = JSON.stringify(
    {
      requiredQuestionCount: input.questionCount,
      lesson: input.lesson,
    },
    null,
    2,
  );

  return [
    "Sen Anlat Hoca'sın. Yalnızca aşağıda verilen, öğrencinin gerçekten çalıştığı doğrulanmış ders içeriğinden Türkçe çoktan seçmeli bir quiz üret.",
    "Dış bilgi, genel model bilgisi, PDF'nin derse alınmamış bölümleri veya atlanan konular hakkında soru sorma.",
    `Tam olarak ${input.questionCount} soru üret; sayıyı değiştirme.`,
    "Her soruda tam olarak dört seçenek ve yalnızca bir tartışmasız doğru cevap olsun.",
    "Anlamayı, kavram ayrımlarını, ilişkileri ve öğrenme hedeflerini ölç; belirsiz, hileli veya önemsiz ayrıntı sorularından kaçın.",
    "Yanlış seçenekler makul olsun fakat ders içeriğine göre açıkça yanlış kalsın.",
    "Aynı soruyu farklı sözcüklerle tekrarlama ve ders birden çok anlamlı bölüm içeriyorsa soruları tek bir küçük ayrıntıda yığma.",
    "Mümkün olduğunda 'hepsi', 'hiçbiri', 'A ve B' gibi seçenekler kullanma.",
    "Her doğru cevap için kısa, öğretici ve yalnızca derse dayalı bir açıklama yaz.",
    "Uzun kaynak pasajlarını aynen kopyalama.",
    "Her sorunun sourceSectionIndex değeri, test ettiği bölümün aşağıdaki lesson.sections dizisindeki sıfır tabanlı indeksidir.",
    "Alan adları ve JSON biçimi verilen şemaya tam uymalıdır.",
    "",
    "Doğrulanmış ders bağlamı:",
    context,
  ].join("\n");
}
