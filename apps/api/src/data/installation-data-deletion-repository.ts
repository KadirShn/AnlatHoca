export interface TemporaryProviderFileReference {
  fileName: string;
  expiresAt?: string;
}

export interface InstallationDataDeletionRepository {
  listTemporaryProviderFiles(
    installationId: string,
  ): Promise<TemporaryProviderFileReference[]>;
  deleteInstallation(installationId: string): Promise<void>;
}

export class D1InstallationDataDeletionRepository
  implements InstallationDataDeletionRepository
{
  constructor(private readonly database: D1Database) {}

  async listTemporaryProviderFiles(
    installationId: string,
  ): Promise<TemporaryProviderFileReference[]> {
    const result = await this.database
      .prepare(
        `SELECT provider_file_name AS fileName, provider_expires_at AS expiresAt
         FROM documents
         WHERE installation_id = ?1
           AND provider = 'gemini'
           AND provider_file_name IS NOT NULL`,
      )
      .bind(installationId)
      .all<{ fileName: string; expiresAt: string | null }>();

    return result.results.map((row) => ({
      fileName: row.fileName,
      ...(row.expiresAt ? { expiresAt: row.expiresAt } : {}),
    }));
  }

  async deleteInstallation(installationId: string): Promise<void> {
    const result = await this.database
      .prepare("DELETE FROM guest_installations WHERE installation_id = ?1")
      .bind(installationId)
      .run();

    if (!result.success) {
      throw new Error("Installation data could not be deleted.");
    }
  }
}
