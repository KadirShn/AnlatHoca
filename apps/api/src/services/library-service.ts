import {
  libraryResponseSchema,
  type LibraryRequest,
  type LibraryResponse,
} from "@anlat-hoca/contracts";

import type { LibraryRepository } from "../data/library-repository";

export async function getLibrary(
  repository: LibraryRepository,
  request: LibraryRequest,
): Promise<LibraryResponse> {
  const [lessons, documents] = await Promise.all([
    repository.listLessons(request.installationId, request.lessonLimit),
    repository.listDocuments(request.installationId, request.documentLimit),
  ]);

  return libraryResponseSchema.parse({ lessons, documents });
}
