import {
  guestSessionRequestSchema,
  type ApiErrorResponse,
  type ApiHealthResponse,
  type ApiInfoResponse,
  type GuestSessionResponse,
} from "@anlat-hoca/contracts";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";

import { assertDatabaseAvailable } from "./data/database-health";
import { D1InstallationRepository } from "./data/installation-repository";
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

app.all("/session", (context) =>
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
