import {
  deleteInstallationDataRequestSchema,
  deleteInstallationDataResponseSchema,
  type DeleteInstallationDataResponse,
} from "@anlat-hoca/contracts";

import { requestJson } from "./client";

export function deleteInstallationData(
  installationId: string,
): Promise<DeleteInstallationDataResponse> {
  const request = deleteInstallationDataRequestSchema.parse({ installationId });

  return requestJson(
    "/privacy/delete-data",
    deleteInstallationDataResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    },
  );
}
