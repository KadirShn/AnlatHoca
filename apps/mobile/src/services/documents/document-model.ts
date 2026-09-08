export interface DocumentCandidate {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface SelectedDocument {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}

export type DocumentValidationErrorCode =
  | "invalid-file"
  | "too-large"
  | "wrong-type";

export type DocumentValidationResult =
  | { valid: true; document: SelectedDocument }
  | {
      valid: false;
      code: DocumentValidationErrorCode;
      message: string;
    };
