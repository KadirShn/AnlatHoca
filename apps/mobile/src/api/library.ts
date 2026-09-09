import {
  libraryRequestSchema,
  libraryResponseSchema,
  type LibraryResponse,
} from "@anlat-hoca/contracts";

import { requestJson } from "./client";

interface GetLibraryInput {
  installationId: string;
  lessonLimit?: number;
  documentLimit?: number;
}

export function getLibrary(input: GetLibraryInput): Promise<LibraryResponse> {
  const request = libraryRequestSchema.parse(input);

  return requestJson("/library", libraryResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}
