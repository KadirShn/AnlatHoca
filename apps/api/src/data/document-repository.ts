export interface CreateUploadedDocumentInput {
  id: string;
  installationId: string;
  originalName: string;
  sizeBytes: number;
  mimeType: "application/pdf";
  provider: "gemini";
  providerFileName: string;
  providerFileUri: string;
  providerExpiresAt?: string;
  status: "uploaded";
}

export type DocumentStatus = "uploaded" | "analyzing" | "analyzed";

export interface DocumentRecord {
  id: string;
  originalName: string;
  mimeType: "application/pdf";
  providerFileName: string;
  providerFileUri: string;
  providerExpiresAt?: string;
  status: DocumentStatus;
  updatedAt: string;
}

export interface DocumentRepository {
  createUploadedDocument(input: CreateUploadedDocumentInput): Promise<void>;
  findByIdForInstallation(
    documentId: string,
    installationId: string,
  ): Promise<DocumentRecord | null>;
  claimForAnalysis(
    documentId: string,
    installationId: string,
    staleBefore: string,
  ): Promise<boolean>;
  resetAnalysis(documentId: string, installationId: string): Promise<void>;
}

export class D1DocumentRepository implements DocumentRepository {
  constructor(private readonly database: D1Database) {}

  async createUploadedDocument(
    input: CreateUploadedDocumentInput,
  ): Promise<void> {
    const result = await this.database
      .prepare(
        `INSERT INTO documents (
           id,
           installation_id,
           original_name,
           size_bytes,
           mime_type,
           provider,
           provider_file_name,
           provider_file_uri,
           provider_expires_at,
           status,
           created_at,
           updated_at
         ) VALUES (
           ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
           strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
           strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         )`,
      )
      .bind(
        input.id,
        input.installationId,
        input.originalName,
        input.sizeBytes,
        input.mimeType,
        input.provider,
        input.providerFileName,
        input.providerFileUri,
        input.providerExpiresAt ?? null,
        input.status,
      )
      .run();

    if (!result.success) {
      throw new Error("Uploaded document metadata could not be persisted.");
    }
  }

  async findByIdForInstallation(
    documentId: string,
    installationId: string,
  ): Promise<DocumentRecord | null> {
    const row = await this.database
      .prepare(
        `SELECT
           id,
           original_name,
           mime_type,
           provider_file_name,
           provider_file_uri,
           provider_expires_at,
           status,
           updated_at
         FROM documents
         WHERE id = ?1 AND installation_id = ?2`,
      )
      .bind(documentId, installationId)
      .first<DocumentDatabaseRow>();

    if (!row) {
      return null;
    }

    if (
      row.mime_type !== "application/pdf" ||
      !isDocumentStatus(row.status)
    ) {
      throw new Error("Stored document metadata is invalid.");
    }

    return {
      id: row.id,
      originalName: row.original_name,
      mimeType: row.mime_type,
      providerFileName: row.provider_file_name,
      providerFileUri: row.provider_file_uri,
      providerExpiresAt: row.provider_expires_at ?? undefined,
      status: row.status,
      updatedAt: row.updated_at,
    };
  }

  async claimForAnalysis(
    documentId: string,
    installationId: string,
    staleBefore: string,
  ): Promise<boolean> {
    const result = await this.database
      .prepare(
        `UPDATE documents
         SET
           status = 'analyzing',
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?1
           AND installation_id = ?2
           AND (
             status = 'uploaded'
             OR (status = 'analyzing' AND updated_at <= ?3)
           )`,
      )
      .bind(documentId, installationId, staleBefore)
      .run();

    return result.success && result.meta.changes === 1;
  }

  async resetAnalysis(
    documentId: string,
    installationId: string,
  ): Promise<void> {
    const result = await this.database
      .prepare(
        `UPDATE documents
         SET
           status = 'uploaded',
           updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?1
           AND installation_id = ?2
           AND status = 'analyzing'`,
      )
      .bind(documentId, installationId)
      .run();

    if (!result.success) {
      throw new Error("Document analysis state could not be reset.");
    }
  }
}

interface DocumentDatabaseRow {
  id: string;
  original_name: string;
  mime_type: string;
  provider_file_name: string;
  provider_file_uri: string;
  provider_expires_at: string | null;
  status: string;
  updated_at: string;
}

function isDocumentStatus(value: string): value is DocumentStatus {
  return value === "uploaded" || value === "analyzing" || value === "analyzed";
}
