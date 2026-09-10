import assert from "node:assert/strict";
import test from "node:test";

import type { InstallationDataDeletionRepository } from "../data/installation-data-deletion-repository";
import { deleteInstallationData } from "./installation-data-deletion-service";

const installationId = "11111111-1111-4111-8111-111111111111";

test("deletes scoped data while cleaning only live provider files", async () => {
  const deletedFiles: string[] = [];
  const deletedInstallations: string[] = [];
  const repository: InstallationDataDeletionRepository = {
    async listTemporaryProviderFiles() {
      return [
        { fileName: "files/live", expiresAt: "2026-09-11T00:00:00.000Z" },
        { fileName: "files/expired", expiresAt: "2026-09-09T00:00:00.000Z" },
        { fileName: "files/unknown" },
      ];
    },
    async deleteInstallation(value) {
      deletedInstallations.push(value);
    },
  };

  const response = await deleteInstallationData(
    { installationId },
    {
      repository,
      fileCleaner: {
        async deleteFile(fileName) {
          deletedFiles.push(fileName);
          if (fileName === "files/live") {
            throw new Error("temporary provider failure");
          }
        },
      },
      now: new Date("2026-09-10T00:00:00.000Z"),
    },
  );

  assert.deepEqual(response, { status: "deleted" });
  assert.deepEqual(deletedFiles, ["files/live", "files/unknown"]);
  assert.deepEqual(deletedInstallations, [installationId]);
});

test("returns the same success response when an installation has no data", async () => {
  let deleted = false;
  const repository: InstallationDataDeletionRepository = {
    async listTemporaryProviderFiles() {
      return [];
    },
    async deleteInstallation() {
      deleted = true;
    },
  };

  const response = await deleteInstallationData(
    { installationId },
    { repository },
  );

  assert.deepEqual(response, { status: "deleted" });
  assert.equal(deleted, true);
});

test("rejects malformed deletion requests before repository access", async () => {
  let accessed = false;
  const repository: InstallationDataDeletionRepository = {
    async listTemporaryProviderFiles() {
      accessed = true;
      return [];
    },
    async deleteInstallation() {
      accessed = true;
    },
  };

  await assert.rejects(
    deleteInstallationData({ installationId: "not-a-uuid" }, { repository }),
  );
  assert.equal(accessed, false);
});
