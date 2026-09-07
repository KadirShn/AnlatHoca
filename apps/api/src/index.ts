import type {
  ApiHealthResponse,
  ApiInfoResponse,
} from "@anlat-hoca/contracts";
import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (context) => {
  const response = {
    name: "Anlat Hoca API",
    status: "ok",
  } satisfies ApiInfoResponse;

  return context.json(response);
});

app.get("/health", (context) => {
  const response = {
    status: "healthy",
  } satisfies ApiHealthResponse;

  return context.json(response);
});

export default app;
