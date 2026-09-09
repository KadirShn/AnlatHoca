export const DEFAULT_GEMINI_ANALYSIS_MODEL = "gemini-3.6-flash";
export const DEFAULT_GEMINI_LESSON_MODEL = "gemini-3.6-flash";
export const DEFAULT_GEMINI_QUIZ_MODEL = "gemini-3.6-flash";
export const DEFAULT_GEMINI_TEACHER_MODEL = "gemini-3.6-flash";

export function resolveGeminiAnalysisModel(
  configuredModel: string | undefined,
): string {
  return resolveGeminiModel(configuredModel, DEFAULT_GEMINI_ANALYSIS_MODEL);
}

export function resolveGeminiLessonModel(
  configuredModel: string | undefined,
): string {
  return resolveGeminiModel(configuredModel, DEFAULT_GEMINI_LESSON_MODEL);
}

export function resolveGeminiQuizModel(
  configuredModel: string | undefined,
): string {
  return resolveGeminiModel(configuredModel, DEFAULT_GEMINI_QUIZ_MODEL);
}

export function resolveGeminiTeacherModel(
  configuredModel: string | undefined,
): string {
  return resolveGeminiModel(configuredModel, DEFAULT_GEMINI_TEACHER_MODEL);
}

function resolveGeminiModel(
  configuredModel: string | undefined,
  fallback: string,
): string {
  const candidate = configuredModel?.trim();

  if (candidate && /^[A-Za-z0-9._-]+$/.test(candidate)) {
    return candidate;
  }

  return fallback;
}
