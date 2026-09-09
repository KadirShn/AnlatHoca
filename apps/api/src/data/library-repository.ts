import type {
  LibraryDocumentSummary,
  LibraryLessonSummary,
} from "@anlat-hoca/contracts";

export interface LibraryRepository {
  listLessons(
    installationId: string,
    limit: number,
  ): Promise<LibraryLessonSummary[]>;
  listDocuments(
    installationId: string,
    limit: number,
  ): Promise<LibraryDocumentSummary[]>;
}

export class D1LibraryRepository implements LibraryRepository {
  constructor(private readonly database: D1Database) {}

  async listLessons(
    installationId: string,
    limit: number,
  ): Promise<LibraryLessonSummary[]> {
    const result = await this.database
      .prepare(
        `WITH latest_attempts AS (
           SELECT lesson_id, attempt_id, score_percent
           FROM (
             SELECT quizzes.lesson_id,
                    attempts.id AS attempt_id,
                    attempts.score_percent,
                    ROW_NUMBER() OVER (
                      PARTITION BY quizzes.lesson_id
                      ORDER BY attempts.created_at DESC, attempts.id DESC
                    ) AS attempt_rank
             FROM quiz_attempts AS attempts
             INNER JOIN lesson_quizzes AS quizzes
               ON quizzes.id = attempts.quiz_id
             WHERE attempts.installation_id = ?1
               AND quizzes.generation_status = 'ready'
           )
           WHERE attempt_rank = 1
         ),
         teacher_metadata AS (
           SELECT threads.lesson_id,
                  threads.id AS thread_id,
                  COUNT(messages.id) AS message_count
           FROM teacher_threads AS threads
           LEFT JOIN teacher_messages AS messages
             ON messages.thread_id = threads.id
           WHERE threads.installation_id = ?1
           GROUP BY threads.lesson_id, threads.id
         )
         SELECT lessons.id,
                lessons.document_id,
                lessons.title,
                lessons.duration_minutes,
                lessons.created_at,
                documents.original_name,
                analyses.title AS analysis_title,
                EXISTS (
                  SELECT 1
                  FROM lesson_quizzes AS available_quiz
                  WHERE available_quiz.lesson_id = lessons.id
                    AND available_quiz.generation_status = 'ready'
                ) AS quiz_available,
                latest_attempts.attempt_id,
                latest_attempts.score_percent,
                teacher_metadata.thread_id,
                COALESCE(teacher_metadata.message_count, 0) AS message_count
         FROM document_lessons AS lessons
         INNER JOIN documents ON documents.id = lessons.document_id
         LEFT JOIN document_analyses AS analyses
           ON analyses.document_id = documents.id
         LEFT JOIN latest_attempts ON latest_attempts.lesson_id = lessons.id
         LEFT JOIN teacher_metadata ON teacher_metadata.lesson_id = lessons.id
         WHERE documents.installation_id = ?1
           AND lessons.generation_status = 'ready'
         ORDER BY lessons.created_at DESC, lessons.id DESC
         LIMIT ?2`,
      )
      .bind(installationId, limit)
      .all<LibraryLessonRow>();

    return result.results.map(mapLessonRow);
  }

  async listDocuments(
    installationId: string,
    limit: number,
  ): Promise<LibraryDocumentSummary[]> {
    const result = await this.database
      .prepare(
        `SELECT documents.id,
                documents.original_name,
                documents.status,
                documents.created_at,
                analyses.title AS analysis_title,
                CASE
                  WHEN analyses.document_id IS NULL THEN NULL
                  ELSE json_array_length(analyses.topics_json)
                END AS topic_count,
                COUNT(lessons.id) AS lesson_count
         FROM documents
         LEFT JOIN document_analyses AS analyses
           ON analyses.document_id = documents.id
         LEFT JOIN document_lessons AS lessons
           ON lessons.document_id = documents.id
          AND lessons.generation_status = 'ready'
         WHERE documents.installation_id = ?1
         GROUP BY documents.id, documents.original_name, documents.status,
                  documents.created_at, analyses.document_id, analyses.title,
                  analyses.topics_json
         ORDER BY documents.created_at DESC, documents.id DESC
         LIMIT ?2`,
      )
      .bind(installationId, limit)
      .all<LibraryDocumentRow>();

    return result.results.map(mapDocumentRow);
  }
}

interface LibraryLessonRow {
  id: string;
  document_id: string;
  title: string;
  duration_minutes: number;
  created_at: string;
  original_name: string;
  analysis_title: string | null;
  quiz_available: number;
  attempt_id: string | null;
  score_percent: number | null;
  thread_id: string | null;
  message_count: number;
}

interface LibraryDocumentRow {
  id: string;
  original_name: string;
  status: string;
  created_at: string;
  analysis_title: string | null;
  topic_count: number | null;
  lesson_count: number;
}

function mapLessonRow(row: LibraryLessonRow): LibraryLessonSummary {
  if (
    (row.duration_minutes !== 10 &&
      row.duration_minutes !== 30 &&
      row.duration_minutes !== 60) ||
    (row.attempt_id === null) !== (row.score_percent === null)
  ) {
    throw new Error("Stored library lesson metadata is invalid.");
  }

  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    durationMinutes: row.duration_minutes,
    createdAt: row.created_at,
    document: {
      name: row.original_name,
      analysisTitle: row.analysis_title,
    },
    quiz: {
      available: row.quiz_available === 1,
      latestAttempt:
        row.attempt_id === null || row.score_percent === null
          ? null
          : { id: row.attempt_id, scorePercent: row.score_percent },
    },
    teacher: {
      threadExists: row.thread_id !== null,
      messageCount: row.message_count,
    },
  };
}

function mapDocumentRow(row: LibraryDocumentRow): LibraryDocumentSummary {
  const analysis =
    row.analysis_title !== null && row.topic_count !== null
      ? { title: row.analysis_title, topicCount: row.topic_count }
      : null;

  return {
    id: row.id,
    name: row.original_name,
    status: analysis && row.status === "analyzed" ? "analyzed" : "uploaded",
    createdAt: row.created_at,
    analysis,
    lessonCount: row.lesson_count,
  };
}
