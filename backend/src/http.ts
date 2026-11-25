import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const DEFAULT_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed = DEFAULT_ORIGIN;
  const requestOrigin = origin ?? "";
  const value =
    allowed === "*"
      ? "*"
      : allowed.split(",").map((s) => s.trim()).includes(requestOrigin)
        ? requestOrigin
        : allowed.split(",")[0]!.trim();

  return {
    "Access-Control-Allow-Origin": value,
    "Access-Control-Allow-Headers": "Authorization,Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Content-Type": "application/json",
  };
}

export function json(
  statusCode: number,
  body: unknown,
  event?: APIGatewayProxyEventV2,
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: corsHeaders(event?.headers?.origin ?? event?.headers?.Origin),
    body: JSON.stringify(body),
  };
}

export function noContent(event?: APIGatewayProxyEventV2): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: corsHeaders(event?.headers?.origin ?? event?.headers?.Origin),
    body: "",
  };
}

export function getPath(event: APIGatewayProxyEventV2): string {
  const raw = event.rawPath || event.requestContext?.http?.path || "/";
  // Strip stage prefix if present (e.g. /prod/extract)
  return raw.replace(/^\/+$/, "/") || "/";
}

export function getMethod(event: APIGatewayProxyEventV2): string {
  return (event.requestContext?.http?.method ?? "GET").toUpperCase();
}

export function parseJsonBody<T = unknown>(event: APIGatewayProxyEventV2): T {
  if (!event.body) throw new Error("Missing body");
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  return JSON.parse(raw) as T;
}

export function bearerToken(event: APIGatewayProxyEventV2): string | null {
  const header =
    event.headers?.authorization ?? event.headers?.Authorization ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] ?? null;
}
