export const DEFAULT_GEMINI_ANALYSIS_MODEL = "gemini-2.5-flash";

export function resolveGeminiAnalysisModel(
  configuredModel: string | undefined,
): string {
  const candidate = configuredModel?.trim();

  if (candidate && /^[A-Za-z0-9._-]+$/.test(candidate)) {
    return candidate;
  }

  return DEFAULT_GEMINI_ANALYSIS_MODEL;
}
