/** Safe, public application metadata. Never add secrets to this package. */
export const APP_NAME = "Anlat Hoca" as const;

/** Mobile PDF selection policy. These UX limits are not a security boundary. */
export const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;
export const MAX_PDF_SIZE_MEGABYTES = MAX_PDF_SIZE_BYTES / (1024 * 1024);
export const PDF_SIZE_LIMIT_LABEL =
  `Maksimum ${MAX_PDF_SIZE_MEGABYTES} MB` as const;
export const SUPPORTED_PDF_MIME_TYPES = ["application/pdf"] as const;
export const SUPPORTED_PDF_EXTENSIONS = [".pdf"] as const;
export const PDF_UPLOAD_MULTIPART_OVERHEAD_BYTES = 64 * 1024;
export const MAX_PDF_UPLOAD_BODY_BYTES =
  MAX_PDF_SIZE_BYTES + PDF_UPLOAD_MULTIPART_OVERHEAD_BYTES;
export const DOCUMENT_UPLOAD_TIMEOUT_MS = 120_000;
export const DOCUMENT_ANALYSIS_TIMEOUT_MS = 120_000;
export const LESSON_GENERATION_TIMEOUT_MS = 120_000;
export const QUIZ_GENERATION_TIMEOUT_MS = 120_000;
export const TEACHER_GENERATION_TIMEOUT_MS = 120_000;

/** Bounded read limits for installation-scoped study history. */
export const DEFAULT_LIBRARY_ITEM_LIMIT = 20;
export const MAX_LIBRARY_ITEM_LIMIT = 50;
export const HOME_RECENT_LESSON_LIMIT = 3;

export {
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
  PUBLIC_PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  type PrivacyPolicySection,
} from "./privacy-policy";

export {
  EXAM_PACKS,
  findExamPack,
  parseExamPackRegistry,
} from "./exam-packs";
export {
  HISTORICAL_SUBJECT_DATASETS,
  buildExamSubjectInsights,
  findExamSubjectHistoricalInsights,
  parseHistoricalSubjectDatasets,
} from "./exam-packs/historical-insights";
export {
  KPSS_HISTORICAL_ADMINISTRATION_YEARS,
  KPSS_HISTORICAL_DATA_VERSION,
} from "./exam-packs/kpss-lisans-historical-v1";

/** Lesson-grounded teacher conversation limits. */
export const MAX_TEACHER_QUESTION_CHARS = 1_200;
export const MAX_TEACHER_ANSWER_CHARS = 3_000;
export const MAX_TEACHER_CONTEXT_TURNS = 6;
export const MAX_TEACHER_QUESTIONS_PER_UTC_DAY = 30;

/** Exact V1 quiz sizes for each supported lesson study budget. */
export const QUIZ_QUESTION_COUNTS = {
  10: 5,
  30: 8,
  60: 10,
} as const;

export function getQuizQuestionCount(
  durationMinutes: keyof typeof QUIZ_QUESTION_COUNTS,
): 5 | 8 | 10 {
  return QUIZ_QUESTION_COUNTS[durationMinutes];
}
