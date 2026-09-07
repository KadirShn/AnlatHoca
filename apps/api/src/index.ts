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

const app = new Hono<{ Bindings: Env }>();

const errorResponse = (
  code: ApiErrorResponse["error"]["code"],
  message: string,
): ApiErrorResponse => ({ error: { code, message } });

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

app.get("/health", (context) => {
  const response = { status: "healthy" } satisfies ApiHealthResponse;
  return context.json(response);
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

    const response = {
      installationId: result.data.installationId,
      sessionType: "guest",
      status: "ready",
    } satisfies GuestSessionResponse;

    return context.json(response);
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
  console.error("Unhandled API error", error);
  return context.json(
    errorResponse("INTERNAL_ERROR", "Beklenmeyen bir hata oluştu."),
    500,
  );
});

export default app;
