import type { GuestSessionResponse } from "@anlat-hoca/contracts";

import type { InstallationRepository } from "../data/installation-repository";

export async function bootstrapGuestSession(
  repository: InstallationRepository,
  installationId: string,
): Promise<GuestSessionResponse> {
  await repository.touch(installationId);

  return {
    installationId,
    sessionType: "guest",
    status: "ready",
  };
}
