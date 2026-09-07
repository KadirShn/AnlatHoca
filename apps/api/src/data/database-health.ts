export async function assertDatabaseAvailable(
  database: D1Database,
): Promise<void> {
  const result = await database
    .prepare("SELECT 1 AS available")
    .first<{ available: number }>();

  if (result?.available !== 1) {
    throw new Error("Database health check failed.");
  }
}
