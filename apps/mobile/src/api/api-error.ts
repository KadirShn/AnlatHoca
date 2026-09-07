export type ApiErrorKind =
  | "configuration"
  | "timeout"
  | "network"
  | "invalidResponse"
  | "server";

interface ApiClientErrorOptions {
  kind: ApiErrorKind;
  status?: number;
  serverCode?: string;
  cause?: unknown;
}

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "ApiClientError";
    this.kind = options.kind;
    this.status = options.status;
    this.serverCode = options.serverCode;
  }
}
