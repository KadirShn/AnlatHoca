import type { GeneratedQuiz } from "../providers/ai/quiz-generation-provider";

export function isGeneratedQuizSemanticallyValid(
  quiz: GeneratedQuiz,
  expectedQuestionCount: number,
  lessonSectionCount: number,
): boolean {
  if (quiz.questions.length !== expectedQuestionCount) {
    return false;
  }

  const normalizedQuestions = new Set<string>();

  for (const question of quiz.questions) {
    if (question.sourceSectionIndex >= lessonSectionCount) {
      return false;
    }

    if (new Set(question.options.map(normalizeText)).size !== 4) {
      return false;
    }

    const normalizedQuestion = normalizeText(question.question);

    if (normalizedQuestions.has(normalizedQuestion)) {
      return false;
    }

    normalizedQuestions.add(normalizedQuestion);
  }

  return true;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}
