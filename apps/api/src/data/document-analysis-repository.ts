import type { DocumentAnalysis } from "@anlat-hoca/contracts";

export interface StoredDocumentAnalysis {
  title: string;
  summary: string;
  topics: unknown;
}

export interface SaveDocumentAnalysisInput {
  documentId: string;
  schemaVersion: string;
  promptVersion: string;
  model: string;
  analysis: DocumentAnalysis;
}

export interface DocumentAnalysisRepository {
  findByDocumentId(documentId: string): Promise<StoredDocumentAnalysis | null>;
  saveAndMarkDocumentAnalyzed(
    input: SaveDocumentAnalysisInput,
  ): Promise<void>;
}

export class D1DocumentAnalysisRepository
  implements DocumentAnalysisRepository
{
  constructor(private readonly database: D1Database) {}

  async findByDocumentId(
    documentId: string,
  ): Promise<StoredDocumentAnalysis | null> {
    const row = await this.database
      .prepare(
        `SELECT title, summary, topics_json
         FROM document_analyses
         WHERE document_id = ?1`,
      )
      .bind(documentId)
      .first<AnalysisDatabaseRow>();

    if (!row) {
      return null;
    }

    let topics: unknown;

    try {
      topics = JSON.parse(row.topics_json);
    } catch (error) {
      throw new Error("Stored document analysis JSON is invalid.", {
        cause: error,
      });
    }

    return { title: row.title, summary: row.summary, topics };
  }

  async saveAndMarkDocumentAnalyzed(
    input: SaveDocumentAnalysisInput,
  ): Promise<void> {
    const results = await this.database.batch([
      this.database
        .prepare(
          `INSERT INTO document_analyses (
             document_id,
             schema_version,
             prompt_version,
             model,
             title,
             summary,
             topics_json
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
           ON CONFLICT (document_id) DO NOTHING`,
        )
        .bind(
          input.documentId,
          input.schemaVersion,
          input.promptVersion,
          input.model,
          input.analysis.title,
          input.analysis.summary,
          JSON.stringify(input.analysis.topics),
        ),
      this.database
        .prepare(
          `UPDATE documents
           SET
             status = 'analyzed',
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = ?1 AND status = 'analyzing'`,
        )
        .bind(input.documentId),
    ]);

    if (
      results.some((result) => !result.success) ||
      results[1]?.meta.changes !== 1
    ) {
      throw new Error("Document analysis could not be persisted.");
    }
  }
}

interface AnalysisDatabaseRow {
  title: string;
  summary: string;
  topics_json: string;
}
