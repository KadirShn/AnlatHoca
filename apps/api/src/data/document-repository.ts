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

export interface DocumentRepository {
  createUploadedDocument(input: CreateUploadedDocumentInput): Promise<void>;
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
           status
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
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
}
