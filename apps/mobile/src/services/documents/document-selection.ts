import {
  MAX_PDF_SIZE_BYTES,
  MAX_PDF_SIZE_MEGABYTES,
  SUPPORTED_PDF_EXTENSIONS,
  SUPPORTED_PDF_MIME_TYPES,
} from "@anlat-hoca/config";
import * as DocumentPicker from "expo-document-picker";

import type {
  DocumentCandidate,
  DocumentValidationResult,
} from "./document-model";

export type PickPdfDocumentResult =
  | { status: "canceled" }
  | { status: "selected"; document: DocumentCandidate };

const GENERIC_MIME_TYPES = new Set(["application/octet-stream"]);

export async function pickPdfDocument(): Promise<PickPdfDocumentResult> {
  const result = await DocumentPicker.getDocumentAsync({
    base64: false,
    copyToCacheDirectory: true,
    multiple: false,
    type: [...SUPPORTED_PDF_MIME_TYPES],
  });

  if (result.canceled) {
    return { status: "canceled" };
  }

  const asset = result.assets[0];

  return {
    status: "selected",
    document: {
      uri: asset?.uri ?? "",
      name: asset?.name ?? "",
      size: asset?.size,
      mimeType: asset?.mimeType,
    },
  };
}

export function validateSelectedDocument(
  candidate: DocumentCandidate,
): DocumentValidationResult {
  const name = candidate.name.trim();
  const uri = candidate.uri.trim();
  const size = candidate.size;

  if (
    name.length === 0 ||
    uri.length === 0 ||
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    size <= 0
  ) {
    return invalidFileResult();
  }

  if (size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      code: "too-large",
      message: `Bu dosya ${MAX_PDF_SIZE_MEGABYTES} MB sınırını aşıyor.`,
    };
  }

  const mimeType = normalizeMimeType(candidate.mimeType);
  const hasPdfMimeType = SUPPORTED_PDF_MIME_TYPES.some(
    (supportedType) => supportedType === mimeType,
  );
  const canUseExtensionFallback =
    mimeType.length === 0 || GENERIC_MIME_TYPES.has(mimeType);
  const hasPdfExtension = SUPPORTED_PDF_EXTENSIONS.some((extension) =>
    name.toLocaleLowerCase("tr-TR").endsWith(extension),
  );

  if (!hasPdfMimeType && !(canUseExtensionFallback && hasPdfExtension)) {
    return {
      valid: false,
      code: "wrong-type",
      message: "Şimdilik yalnızca PDF dosyaları destekleniyor.",
    };
  }

  return {
    valid: true,
    document: {
      uri,
      name,
      size,
      mimeType: candidate.mimeType,
    },
  };
}

export function formatFileSize(sizeInBytes: number): string {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) {
    return "0 B";
  }

  if (sizeInBytes < 1024) {
    return `${Math.round(sizeInBytes)} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${formatDecimal(sizeInBytes / 1024)} KB`;
  }

  return `${formatDecimal(sizeInBytes / (1024 * 1024))} MB`;
}

function normalizeMimeType(mimeType?: string): string {
  return mimeType?.split(";", 1)[0]?.trim().toLocaleLowerCase("en-US") ?? "";
}

function formatDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(1).replace(".", ",");
}

function invalidFileResult(): DocumentValidationResult {
  return {
    valid: false,
    code: "invalid-file",
    message: "Bu PDF kullanılamıyor. Lütfen başka bir dosya seç.",
  };
}
