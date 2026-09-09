import type { GeneratedQuiz } from "../providers/ai/quiz-generation-provider";

export interface QuizCacheIdentity {
  lessonId: string;
  schemaVersion: string;
  promptVersion: string;
  model: string;
}

export interface StoredQuiz {
  id: string;
  lessonId: string;
  status: "generating" | "ready";
  title: string | null;
  questions: unknown;
  updatedAt: string;
}

export interface QuizGenerationClaim extends QuizCacheIdentity {
  id: string;
  generationToken: string;
}

export type PersistedQuizQuestion = GeneratedQuiz["questions"][number] & {
  id: string;
};

export interface CompleteQuizInput {
  id: string;
  generationToken: string;
  title: string;
  questions: PersistedQuizQuestion[];
}

export interface LessonQuizRepository {
  findCurrentQuiz(identity: QuizCacheIdentity): Promise<StoredQuiz | null>;
  createGenerationClaim(input: QuizGenerationClaim): Promise<boolean>;
  reclaimStaleGeneration(
    identity: QuizCacheIdentity,
    generationToken: string,
    staleBefore: string,
  ): Promise<string | null>;
  completeGeneration(input: CompleteQuizInput): Promise<void>;
  releaseGenerationClaim(id: string, generationToken: string): Promise<void>;
  findByIdForInstallation(
    quizId: string,
    installationId: string,
  ): Promise<StoredQuiz | null>;
}

export class D1LessonQuizRepository implements LessonQuizRepository {
  constructor(private readonly database: D1Database) {}

  async findCurrentQuiz(
    identity: QuizCacheIdentity,
  ): Promise<StoredQuiz | null> {
    const row = await this.database
      .prepare(
        `SELECT id, lesson_id, generation_status, title, questions_json, updated_at
         FROM lesson_quizzes
         WHERE lesson_id = ?1
           AND schema_version = ?2
           AND prompt_version = ?3
           AND model = ?4`,
      )
      .bind(
        identity.lessonId,
        identity.schemaVersion,
        identity.promptVersion,
        identity.model,
      )
      .first<QuizDatabaseRow>();

    return row ? mapQuizRow(row) : null;
  }

  async createGenerationClaim(input: QuizGenerationClaim): Promise<boolean> {
    const result = await this.database
      .prepare(
        `INSERT INTO lesson_quizzes (
           id, lesson_id, schema_version, prompt_version, model,
           generation_status, generation_token
         ) VALUES (?1, ?2, ?3, ?4, ?5, 'generating', ?6)
         ON CONFLICT DO NOTHING`,
      )
      .bind(
        input.id,
        input.lessonId,
        input.schemaVersion,
        input.promptVersion,
        input.model,
        input.generationToken,
      )
      .run();

    return result.success && result.meta.changes === 1;
  }

  async reclaimStaleGeneration(
    identity: QuizCacheIdentity,
    generationToken: string,
    staleBefore: string,
  ): Promise<string | null> {
    const row = await this.database
      .prepare(
        `UPDATE lesson_quizzes
         SET generation_token = ?5,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE lesson_id = ?1
           AND schema_version = ?2
           AND prompt_version = ?3
           AND model = ?4
           AND generation_status = 'generating'
           AND updated_at <= ?6
         RETURNING id`,
      )
      .bind(
        identity.lessonId,
        identity.schemaVersion,
        identity.promptVersion,
        identity.model,
        generationToken,
        staleBefore,
      )
      .first<{ id: string }>();

    return row?.id ?? null;
  }

  async completeGeneration(input: CompleteQuizInput): Promise<void> {
    const result = await this.database
      .prepare(
        `UPDATE lesson_quizzes
         SET generation_status = 'ready',
             generation_token = NULL,
             title = ?3,
             questions_json = ?4,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?1
           AND generation_status = 'generating'
           AND generation_token = ?2`,
      )
      .bind(
        input.id,
        input.generationToken,
        input.title,
        JSON.stringify(input.questions),
      )
      .run();

    if (!result.success || result.meta.changes !== 1) {
      throw new Error("Generated quiz could not be persisted.");
    }
  }

  async releaseGenerationClaim(
    id: string,
    generationToken: string,
  ): Promise<void> {
    const result = await this.database
      .prepare(
        `DELETE FROM lesson_quizzes
         WHERE id = ?1
           AND generation_status = 'generating'
           AND generation_token = ?2`,
      )
      .bind(id, generationToken)
      .run();

    if (!result.success) {
      throw new Error("Quiz generation claim could not be released.");
    }
  }

  async findByIdForInstallation(
    quizId: string,
    installationId: string,
  ): Promise<StoredQuiz | null> {
    const row = await this.database
      .prepare(
        `SELECT quizzes.id, quizzes.lesson_id, quizzes.generation_status,
                quizzes.title, quizzes.questions_json, quizzes.updated_at
         FROM lesson_quizzes AS quizzes
         INNER JOIN document_lessons AS lessons ON lessons.id = quizzes.lesson_id
         INNER JOIN documents ON documents.id = lessons.document_id
         WHERE quizzes.id = ?1
           AND documents.installation_id = ?2
           AND quizzes.generation_status = 'ready'`,
      )
      .bind(quizId, installationId)
      .first<QuizDatabaseRow>();

    return row ? mapQuizRow(row) : null;
  }
}

interface QuizDatabaseRow {
  id: string;
  lesson_id: string;
  generation_status: string;
  title: string | null;
  questions_json: string | null;
  updated_at: string;
}

function mapQuizRow(row: QuizDatabaseRow): StoredQuiz {
  if (
    row.generation_status !== "generating" &&
    row.generation_status !== "ready"
  ) {
    throw new Error("Stored quiz metadata is invalid.");
  }

  return {
    id: row.id,
    lessonId: row.lesson_id,
    status: row.generation_status,
    title: row.title,
    questions: parseJson(row.questions_json),
    updatedAt: row.updated_at,
  };
}

function parseJson(value: string | null): unknown {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Stored quiz JSON is invalid.", { cause: error });
  }
}
