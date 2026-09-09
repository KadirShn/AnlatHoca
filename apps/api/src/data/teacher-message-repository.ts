import type { TeacherRelatedSection } from "@anlat-hoca/contracts";

export interface StoredTeacherMessage {
  id: string;
  threadId: string;
  sequence: number;
  role: "user" | "assistant";
  content: string;
  relatedSections: unknown;
  suggestedFollowUps: unknown;
  promptVersion: string | null;
  model: string | null;
  createdAt: string;
}

export interface AppendTeacherExchangeInput {
  threadId: string;
  userMessageId: string;
  userContent: string;
  assistantMessageId: string;
  assistantContent: string;
  relatedSections: TeacherRelatedSection[];
  suggestedFollowUps: string[];
  promptVersion: string;
  model: string;
  createdAt: string;
}

export interface TeacherMessageRepository {
  listAll(threadId: string): Promise<StoredTeacherMessage[]>;
  listRecent(
    threadId: string,
    maximumMessages: number,
  ): Promise<StoredTeacherMessage[]>;
  countUserMessagesForInstallation(
    installationId: string,
    startInclusive: string,
    endExclusive: string,
  ): Promise<number>;
  appendExchange(
    input: AppendTeacherExchangeInput,
  ): Promise<StoredTeacherMessage>;
}

export class D1TeacherMessageRepository implements TeacherMessageRepository {
  constructor(private readonly database: D1Database) {}

  async listAll(threadId: string): Promise<StoredTeacherMessage[]> {
    const result = await this.database
      .prepare(
        `${teacherMessageSelect}
         WHERE thread_id = ?1
         ORDER BY sequence ASC`,
      )
      .bind(threadId)
      .all<TeacherMessageDatabaseRow>();

    return result.results.map(mapMessageRow);
  }

  async listRecent(
    threadId: string,
    maximumMessages: number,
  ): Promise<StoredTeacherMessage[]> {
    const result = await this.database
      .prepare(
        `SELECT * FROM (
           ${teacherMessageSelect}
           WHERE thread_id = ?1
           ORDER BY sequence DESC
           LIMIT ?2
         )
         ORDER BY sequence ASC`,
      )
      .bind(threadId, maximumMessages)
      .all<TeacherMessageDatabaseRow>();

    return result.results.map(mapMessageRow);
  }

  async countUserMessagesForInstallation(
    installationId: string,
    startInclusive: string,
    endExclusive: string,
  ): Promise<number> {
    const row = await this.database
      .prepare(
        `SELECT COUNT(*) AS message_count
         FROM teacher_threads AS threads
         INNER JOIN teacher_messages AS messages
           ON messages.thread_id = threads.id
         WHERE threads.installation_id = ?1
           AND messages.role = 'user'
           AND messages.created_at >= ?2
           AND messages.created_at < ?3`,
      )
      .bind(installationId, startInclusive, endExclusive)
      .first<{ message_count: number }>();

    return row?.message_count ?? 0;
  }

  async appendExchange(
    input: AppendTeacherExchangeInput,
  ): Promise<StoredTeacherMessage> {
    const userStatement = this.database
      .prepare(
        `INSERT INTO teacher_messages (
           id, thread_id, sequence, role, content, created_at
         ) VALUES (
           ?1, ?2,
           (SELECT COALESCE(MAX(sequence), 0) + 1
            FROM teacher_messages WHERE thread_id = ?2),
           'user', ?3, ?4
         )`,
      )
      .bind(
        input.userMessageId,
        input.threadId,
        input.userContent,
        input.createdAt,
      );
    const assistantStatement = this.database
      .prepare(
        `INSERT INTO teacher_messages (
           id, thread_id, sequence, role, content, related_sections_json,
           suggested_follow_ups_json, prompt_version, model, created_at
         ) VALUES (
           ?1, ?2,
           (SELECT COALESCE(MAX(sequence), 0) + 1
            FROM teacher_messages WHERE thread_id = ?2),
           'assistant', ?3, ?4, ?5, ?6, ?7, ?8
         )`,
      )
      .bind(
        input.assistantMessageId,
        input.threadId,
        input.assistantContent,
        JSON.stringify(input.relatedSections),
        JSON.stringify(input.suggestedFollowUps),
        input.promptVersion,
        input.model,
        input.createdAt,
      );
    const threadStatement = this.database
      .prepare(
        `UPDATE teacher_threads SET updated_at = ?2 WHERE id = ?1`,
      )
      .bind(input.threadId, input.createdAt);
    const results = await this.database.batch([
      userStatement,
      assistantStatement,
      threadStatement,
    ]);

    if (
      results.length !== 3 ||
      results.some(
        (result) => !result.success || result.meta.changes !== 1,
      )
    ) {
      throw new Error("Teacher exchange could not be persisted.");
    }

    const stored = await this.database
      .prepare(
        `${teacherMessageSelect}
         WHERE id = ?1 AND thread_id = ?2`,
      )
      .bind(input.assistantMessageId, input.threadId)
      .first<TeacherMessageDatabaseRow>();

    if (!stored) {
      throw new Error("Persisted teacher answer could not be read.");
    }

    return mapMessageRow(stored);
  }
}

const teacherMessageSelect = `SELECT id, thread_id, sequence, role, content,
  related_sections_json, suggested_follow_ups_json, prompt_version, model,
  created_at FROM teacher_messages`;

interface TeacherMessageDatabaseRow {
  id: string;
  thread_id: string;
  sequence: number;
  role: string;
  content: string;
  related_sections_json: string | null;
  suggested_follow_ups_json: string | null;
  prompt_version: string | null;
  model: string | null;
  created_at: string;
}

function mapMessageRow(row: TeacherMessageDatabaseRow): StoredTeacherMessage {
  if (row.role !== "user" && row.role !== "assistant") {
    throw new Error("Stored teacher message role is invalid.");
  }

  return {
    id: row.id,
    threadId: row.thread_id,
    sequence: row.sequence,
    role: row.role,
    content: row.content,
    relatedSections: parseJson(row.related_sections_json),
    suggestedFollowUps: parseJson(row.suggested_follow_ups_json),
    promptVersion: row.prompt_version,
    model: row.model,
    createdAt: row.created_at,
  };
}

function parseJson(value: string | null): unknown {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Stored teacher message JSON is invalid.", { cause: error });
  }
}
