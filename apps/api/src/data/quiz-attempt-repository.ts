import type {
  QuizSubmissionAnswer,
  WeakQuizSection,
} from "@anlat-hoca/contracts";

export interface CreateQuizAttemptInput {
  id: string;
  quizId: string;
  installationId: string;
  answers: QuizSubmissionAnswer[];
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  weakSections: WeakQuizSection[];
}

export interface StoredQuizAttempt {
  id: string;
  quizId: string;
  installationId: string;
  answers: unknown;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  weakSections: unknown;
  createdAt: string;
}

export interface QuizAttemptRepository {
  create(input: CreateQuizAttemptInput): Promise<StoredQuizAttempt>;
  findByIdForInstallation(
    attemptId: string,
    installationId: string,
  ): Promise<StoredQuizAttempt | null>;
}

export class D1QuizAttemptRepository implements QuizAttemptRepository {
  constructor(private readonly database: D1Database) {}

  async create(input: CreateQuizAttemptInput): Promise<StoredQuizAttempt> {
    const row = await this.database
      .prepare(
        `INSERT INTO quiz_attempts (
           id, quiz_id, installation_id, answers_json, correct_count,
           total_questions, score_percent, weak_sections_json
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         RETURNING created_at`,
      )
      .bind(
        input.id,
        input.quizId,
        input.installationId,
        JSON.stringify(input.answers),
        input.correctCount,
        input.totalQuestions,
        input.scorePercent,
        JSON.stringify(input.weakSections),
      )
      .first<{ created_at: string }>();

    if (!row) {
      throw new Error("Quiz attempt could not be persisted.");
    }

    return {
      id: input.id,
      quizId: input.quizId,
      installationId: input.installationId,
      answers: input.answers,
      correctCount: input.correctCount,
      totalQuestions: input.totalQuestions,
      scorePercent: input.scorePercent,
      weakSections: input.weakSections,
      createdAt: row.created_at,
    };
  }

  async findByIdForInstallation(
    attemptId: string,
    installationId: string,
  ): Promise<StoredQuizAttempt | null> {
    const row = await this.database
      .prepare(
        `SELECT attempts.id, attempts.quiz_id, attempts.installation_id,
                attempts.answers_json, attempts.correct_count,
                attempts.total_questions, attempts.score_percent,
                attempts.weak_sections_json, attempts.created_at
         FROM quiz_attempts AS attempts
         INNER JOIN lesson_quizzes AS quizzes ON quizzes.id = attempts.quiz_id
         INNER JOIN document_lessons AS lessons ON lessons.id = quizzes.lesson_id
         INNER JOIN documents ON documents.id = lessons.document_id
         WHERE attempts.id = ?1
           AND attempts.installation_id = ?2
           AND documents.installation_id = ?2`,
      )
      .bind(attemptId, installationId)
      .first<QuizAttemptDatabaseRow>();

    return row ? mapAttemptRow(row) : null;
  }
}

interface QuizAttemptDatabaseRow {
  id: string;
  quiz_id: string;
  installation_id: string;
  answers_json: string;
  correct_count: number;
  total_questions: number;
  score_percent: number;
  weak_sections_json: string;
  created_at: string;
}

function mapAttemptRow(row: QuizAttemptDatabaseRow): StoredQuizAttempt {
  return {
    id: row.id,
    quizId: row.quiz_id,
    installationId: row.installation_id,
    answers: parseJson(row.answers_json),
    correctCount: row.correct_count,
    totalQuestions: row.total_questions,
    scorePercent: row.score_percent,
    weakSections: parseJson(row.weak_sections_json),
    createdAt: row.created_at,
  };
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Stored quiz attempt JSON is invalid.", { cause: error });
  }
}
