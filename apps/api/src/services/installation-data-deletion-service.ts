import {
  deleteInstallationDataRequestSchema,
  type DeleteInstallationDataResponse,
} from "@anlat-hoca/contracts";

import type { InstallationDataDeletionRepository } from "../data/installation-data-deletion-repository";

export interface TemporaryFileCleaner {
  deleteFile(providerFileName: string): Promise<void>;
}

interface DeleteInstallationDataDependencies {
  repository: InstallationDataDeletionRepository;
  fileCleaner?: TemporaryFileCleaner;
  now?: Date;
}

export async function deleteInstallationData(
  body: unknown,
  dependencies: DeleteInstallationDataDependencies,
): Promise<DeleteInstallationDataResponse> {
  const request = deleteInstallationDataRequestSchema.parse(body);
  const providerFiles = await dependencies.repository.listTemporaryProviderFiles(
    request.installationId,
  );
  const now = dependencies.now ?? new Date();

  if (dependencies.fileCleaner) {
    for (const file of providerFiles) {
      if (file.expiresAt && Date.parse(file.expiresAt) <= now.getTime()) {
        continue;
      }

      try {
        await dependencies.fileCleaner.deleteFile(file.fileName);
      } catch {
        // Provider cleanup is best-effort. Persistent deletion must still proceed.
      }
    }
  }

  await dependencies.repository.deleteInstallation(request.installationId);
  return { status: "deleted" };
}
