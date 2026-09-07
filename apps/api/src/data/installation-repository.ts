export interface InstallationRepository {
  touch(installationId: string): Promise<void>;
}

export class D1InstallationRepository implements InstallationRepository {
  constructor(private readonly database: D1Database) {}

  async touch(installationId: string): Promise<void> {
    const result = await this.database
      .prepare(
        `INSERT INTO guest_installations (installation_id)
         VALUES (?1)
         ON CONFLICT (installation_id)
         DO UPDATE SET last_seen_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      )
      .bind(installationId)
      .run();

    if (!result.success) {
      throw new Error("Guest installation could not be persisted.");
    }
  }
}
