import type {
  LessonContent,
  LessonDuration,
} from "@anlat-hoca/contracts";

export interface LessonCacheIdentity {
  documentId: string;
  durationMinutes: LessonDuration;
  schemaVersion: string;
  promptVersion: string;
  model: string;
}

export interface StoredLesson {
  id: string;
  documentId: string;
  durationMinutes: LessonDuration;
  status: "generating" | "ready";
  title: string | null;
  overview: string | null;
  learningObjectives: unknown;
  sections: unknown;
  recap: unknown;
  skippedTopics: unknown;
  updatedAt: string;
}

export interface LessonGenerationClaim extends LessonCacheIdentity {
  id: string;
  generationToken: string;
}

export interface CompleteLessonInput {
  id: string;
  generationToken: string;
  content: LessonContent;
}

export interface DocumentLessonRepository {
  findCurrentLesson(identity: LessonCacheIdentity): Promise<StoredLesson | null>;
  createGenerationClaim(input: LessonGenerationClaim): Promise<boolean>;
  reclaimStaleGeneration(
    identity: LessonCacheIdentity,
    generationToken: string,
    staleBefore: string,
  ): Promise<string | null>;
  completeGeneration(input: CompleteLessonInput): Promise<void>;
  releaseGenerationClaim(id: string, generationToken: string): Promise<void>;
  findByIdForInstallation(
    lessonId: string,
    installationId: string,
  ): Promise<StoredLesson | null>;
}

export class D1DocumentLessonRepository
  implements DocumentLessonRepository
{
  constructor(private readonly database: D1Database) {}

  async findCurrentLesson(
    identity: LessonCacheIdentity,
  ): Promise<StoredLesson | null> {
    const row = await this.database
      .prepare(
        `SELECT
           id,
           document_id,
           duration_minutes,
           generation_status,
           title,
           overview,
           learning_objectives_json,
           sections_json,
           recap_json,
           skipped_topics_json,
           updated_at
         FROM document_lessons
         WHERE document_id = ?1
           AND duration_minutes = ?2
           AND schema_version = ?3
           AND prompt_version = ?4
           AND model = ?5`,
      )
      .bind(
        identity.documentId,
        identity.durationMinutes,
        identity.schemaVersion,
        identity.promptVersion,
        identity.model,
      )
      .first<LessonDatabaseRow>();

    return row ? mapLessonRow(row) : null;
  }

  async createGenerationClaim(input: LessonGenerationClaim): Promise<boolean> {
    const result = await this.database
      .prepare(
        `INSERT INTO document_lessons (
           id,
           document_id,
           duration_minutes,
           schema_version,
           prompt_version,
           model,
           generation_status,
           generation_token
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'generating', ?7)
         ON CONFLICT DO NOTHING`,
      )
      .bind(
        input.id,
        input.documentId,
        input.durationMinutes,
        input.schemaVersion,
        input.promptVersion,
        input.model,
        input.generationToken,
      )
      .run();

    return result.success && result.meta.changes === 1;
  }

  async reclaimStaleGeneration(
    identity: LessonCacheIdentity,
    generationToken: string,
    staleBefore: string,
  ): Promise<string | null> {
    const row = await this.database
      .prepare(
        `UPDATE document_lessons
         SET
           generation_token = ?6,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE document_id = ?1
           AND duration_minutes = ?2
           AND schema_version = ?3
           AND prompt_version = ?4
           AND model = ?5
           AND generation_status = 'generating'
           AND updated_at <= ?7
         RETURNING id`,
      )
      .bind(
        identity.documentId,
        identity.durationMinutes,
        identity.schemaVersion,
        identity.promptVersion,
        identity.model,
        generationToken,
        staleBefore,
      )
      .first<{ id: string }>();

    return row?.id ?? null;
  }

  async completeGeneration(input: CompleteLessonInput): Promise<void> {
    const result = await this.database
      .prepare(
        `UPDATE document_lessons
         SET
           generation_status = 'ready',
           generation_token = NULL,
           title = ?3,
           overview = ?4,
           learning_objectives_json = ?5,
           sections_json = ?6,
           recap_json = ?7,
           skipped_topics_json = ?8,
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?1
           AND generation_status = 'generating'
           AND generation_token = ?2`,
      )
      .bind(
        input.id,
        input.generationToken,
        input.content.title,
        input.content.overview,
        JSON.stringify(input.content.learningObjectives),
        JSON.stringify(input.content.sections),
        JSON.stringify(input.content.recap),
        JSON.stringify(input.content.skippedTopics),
      )
      .run();

    if (!result.success || result.meta.changes !== 1) {
      throw new Error("Generated lesson could not be persisted.");
    }
  }

  async releaseGenerationClaim(
    id: string,
    generationToken: string,
  ): Promise<void> {
    const result = await this.database
      .prepare(
        `DELETE FROM document_lessons
         WHERE id = ?1
           AND generation_status = 'generating'
           AND generation_token = ?2`,
      )
      .bind(id, generationToken)
      .run();

    if (!result.success) {
      throw new Error("Lesson generation claim could not be released.");
    }
  }

  async findByIdForInstallation(
    lessonId: string,
    installationId: string,
  ): Promise<StoredLesson | null> {
    const row = await this.database
      .prepare(
        `SELECT
           lessons.id,
           lessons.document_id,
           lessons.duration_minutes,
           lessons.generation_status,
           lessons.title,
           lessons.overview,
           lessons.learning_objectives_json,
           lessons.sections_json,
           lessons.recap_json,
           lessons.skipped_topics_json,
           lessons.updated_at
         FROM document_lessons AS lessons
         INNER JOIN documents
           ON documents.id = lessons.document_id
         WHERE lessons.id = ?1
           AND documents.installation_id = ?2
           AND lessons.generation_status = 'ready'`,
      )
      .bind(lessonId, installationId)
      .first<LessonDatabaseRow>();

    return row ? mapLessonRow(row) : null;
  }
}

interface LessonDatabaseRow {
  id: string;
  document_id: string;
  duration_minutes: number;
  generation_status: string;
  title: string | null;
  overview: string | null;
  learning_objectives_json: string | null;
  sections_json: string | null;
  recap_json: string | null;
  skipped_topics_json: string | null;
  updated_at: string;
}

function mapLessonRow(row: LessonDatabaseRow): StoredLesson {
  if (
    (row.duration_minutes !== 10 &&
      row.duration_minutes !== 30 &&
      row.duration_minutes !== 60) ||
    (row.generation_status !== "generating" &&
      row.generation_status !== "ready")
  ) {
    throw new Error("Stored lesson metadata is invalid.");
  }

  return {
    id: row.id,
    documentId: row.document_id,
    durationMinutes: row.duration_minutes,
    status: row.generation_status,
    title: row.title,
    overview: row.overview,
    learningObjectives: parseJson(row.learning_objectives_json),
    sections: parseJson(row.sections_json),
    recap: parseJson(row.recap_json),
    skippedTopics: parseJson(row.skipped_topics_json),
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
    throw new Error("Stored lesson JSON is invalid.", { cause: error });
  }
}
