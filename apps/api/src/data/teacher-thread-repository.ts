export interface StoredTeacherThread {
  id: string;
  lessonId: string;
  installationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherThreadRepository {
  findOrCreate(
    lessonId: string,
    installationId: string,
  ): Promise<StoredTeacherThread>;
  findByIdForInstallation(
    threadId: string,
    installationId: string,
  ): Promise<StoredTeacherThread | null>;
}

export class D1TeacherThreadRepository implements TeacherThreadRepository {
  constructor(private readonly database: D1Database) {}

  async findOrCreate(
    lessonId: string,
    installationId: string,
  ): Promise<StoredTeacherThread> {
    await this.database
      .prepare(
        `INSERT INTO teacher_threads (id, lesson_id, installation_id)
         VALUES (?1, ?2, ?3)
         ON CONFLICT (lesson_id, installation_id) DO NOTHING`,
      )
      .bind(crypto.randomUUID(), lessonId, installationId)
      .run();

    const row = await this.database
      .prepare(
        `SELECT id, lesson_id, installation_id, created_at, updated_at
         FROM teacher_threads
         WHERE lesson_id = ?1 AND installation_id = ?2`,
      )
      .bind(lessonId, installationId)
      .first<TeacherThreadDatabaseRow>();

    if (!row) {
      throw new Error("Teacher thread could not be found or created.");
    }

    return mapThreadRow(row);
  }

  async findByIdForInstallation(
    threadId: string,
    installationId: string,
  ): Promise<StoredTeacherThread | null> {
    const row = await this.database
      .prepare(
        `SELECT threads.id, threads.lesson_id, threads.installation_id,
                threads.created_at, threads.updated_at
         FROM teacher_threads AS threads
         INNER JOIN document_lessons AS lessons
           ON lessons.id = threads.lesson_id
         INNER JOIN documents ON documents.id = lessons.document_id
         WHERE threads.id = ?1
           AND threads.installation_id = ?2
           AND documents.installation_id = ?2
           AND lessons.generation_status = 'ready'`,
      )
      .bind(threadId, installationId)
      .first<TeacherThreadDatabaseRow>();

    return row ? mapThreadRow(row) : null;
  }
}

interface TeacherThreadDatabaseRow {
  id: string;
  lesson_id: string;
  installation_id: string;
  created_at: string;
  updated_at: string;
}

function mapThreadRow(row: TeacherThreadDatabaseRow): StoredTeacherThread {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    installationId: row.installation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
