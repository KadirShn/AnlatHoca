import {
  guestSessionRequestSchema,
  type ApiErrorResponse,
  type ApiHealthResponse,
  type ApiInfoResponse,
  type GuestSessionResponse,
} from "@anlat-hoca/contracts";
import { MAX_PDF_UPLOAD_BODY_BYTES } from "@anlat-hoca/config";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";

import { assertDatabaseAvailable } from "./data/database-health";
import { D1DocumentRepository } from "./data/document-repository";
import { D1InstallationRepository } from "./data/installation-repository";
import { GeminiFilesProvider } from "./providers/files/gemini-files-provider";
import {
  DocumentUploadError,
  uploadDocument,
} from "./services/document-upload-service";
import { bootstrapGuestSession } from "./services/guest-session-service";

const app = new Hono<{ Bindings: Env }>();

const errorResponse = (
  code: ApiErrorResponse["error"]["code"],
  message: string,
): ApiErrorResponse => ({ error: { code, message } });

const logOperationalError = (operation: string, error: unknown) => {
  console.error(
    JSON.stringify({
      event: "operation_failed",
      operation,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error ? error.message : "Unknown database error",
    }),
  );
};

const internalErrorResponse = () =>
  errorResponse("INTERNAL_ERROR", "İşlem şu anda tamamlanamadı.");

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 86_400,
  }),
);

app.get("/", (context) => {
  const response = {
    name: "Anlat Hoca API",
    status: "ok",
  } satisfies ApiInfoResponse;

  return context.json(response);
});

app.get("/health", async (context) => {
  try {
    await assertDatabaseAvailable(context.env.DB);
    const response = { status: "healthy" } satisfies ApiHealthResponse;
    return context.json(response);
  } catch (error) {
    logOperationalError("database_health", error);
    return context.json(internalErrorResponse(), 503);
  }
});

app.post(
  "/session",
  bodyLimit({
    maxSize: 1_024,
    onError: (context) =>
      context.json(errorResponse("INVALID_REQUEST", "Geçersiz istek."), 400),
  }),
  async (context) => {
    let body: unknown;

    try {
      body = await context.req.json();
    } catch {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const result = guestSessionRequestSchema.safeParse(body);

    if (!result.success) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    try {
      const repository = new D1InstallationRepository(context.env.DB);
      const response = await bootstrapGuestSession(
        repository,
        result.data.installationId,
      );

      return context.json(response satisfies GuestSessionResponse);
    } catch (error) {
      logOperationalError("guest_installation_touch", error);
      return context.json(internalErrorResponse(), 500);
    }
  },
);

app.post(
  "/documents/upload",
  bodyLimit({
    maxSize: MAX_PDF_UPLOAD_BODY_BYTES,
    onError: (context) =>
      context.json(
        errorResponse(
          "FILE_TOO_LARGE",
          "Bu dosya 15 MB sınırını aşıyor.",
        ),
        413,
      ),
  }),
  async (context) => {
    const contentType = context.req.header("Content-Type") ?? "";

    if (
      !contentType
        .toLocaleLowerCase("en-US")
        .startsWith("multipart/form-data;")
    ) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    let body: Awaited<ReturnType<typeof context.req.parseBody>>;

    try {
      body = await context.req.parseBody({ all: true });
    } catch {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    if (
      Object.keys(body).some(
        (key) => key !== "installationId" && key !== "file",
      )
    ) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const installationValues = toFormValues(body.installationId);
    const fileValues = toFormValues(body.file);
    const installationId = installationValues[0];
    const file = fileValues[0];

    if (
      installationValues.length !== 1 ||
      typeof installationId !== "string" ||
      fileValues.length !== 1 ||
      !(file instanceof File)
    ) {
      return context.json(
        errorResponse("INVALID_REQUEST", "Geçersiz istek."),
        400,
      );
    }

    const apiKey = context.env.GEMINI_API_KEY?.trim();
    const fileProvider = apiKey ? new GeminiFilesProvider(apiKey) : undefined;

    try {
      const response = await uploadDocument({
        installationId,
        file,
        installationRepository: new D1InstallationRepository(context.env.DB),
        documentRepository: new D1DocumentRepository(context.env.DB),
        fileProvider,
      });

      return context.json(response, 201);
    } catch (error) {
      if (error instanceof DocumentUploadError) {
        if (error.status >= 500 && error.code !== "AI_NOT_CONFIGURED") {
          logOperationalError("document_upload", error);
        }

        return context.json(
          errorResponse(error.code, error.publicMessage),
          error.status,
        );
      }

      logOperationalError("document_upload", error);
      return context.json(internalErrorResponse(), 500);
    }
  },
);

app.all("/session", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.all("/documents/upload", (context) =>
  context.json(
    errorResponse("METHOD_NOT_ALLOWED", "Bu yöntem desteklenmiyor."),
    405,
    { Allow: "POST" },
  ),
);

app.notFound((context) =>
  context.json(errorResponse("NOT_FOUND", "Kaynak bulunamadı."), 404),
);

app.onError((error, context) => {
  logOperationalError("unhandled_request", error);
  return context.json(internalErrorResponse(), 500);
});

export default app;

function toFormValues(
  value: string | File | (string | File)[] | undefined,
): (string | File)[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}
