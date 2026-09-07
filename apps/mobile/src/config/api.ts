export type ApiConfiguration =
  | { status: "configured"; baseUrl: string }
  | { status: "missing" }
  | { status: "invalid" };

export function getApiConfiguration(): ApiConfiguration {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!value) {
    return { status: "missing" };
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { status: "invalid" };
    }

    return {
      status: "configured",
      baseUrl: url.toString().replace(/\/$/, ""),
    };
  } catch {
    return { status: "invalid" };
  }
}
