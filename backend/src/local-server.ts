/**
 * Local HTTP wrapper around the Lambda handler for development.
 * Loads secrets from the repo root .env
 */
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { handler } from "./handler.js";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
loadEnvFile(resolve(__dirname, "../.env"));

const PORT = Number(process.env.API_PORT || 4000);

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function toEvent(
  req: IncomingMessage,
  body: string,
): Promise<APIGatewayProxyEventV2> {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url || "/", `http://${host}`);
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers[k] = v;
    else if (Array.isArray(v)) headers[k] = v.join(",");
  }

  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: url.pathname,
    rawQueryString: url.search.replace(/^\?/, ""),
    headers,
    requestContext: {
      accountId: "local",
      apiId: "local",
      domainName: host,
      domainPrefix: "local",
      http: {
        method: (req.method || "GET").toUpperCase(),
        path: url.pathname,
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: headers["user-agent"] || "",
      },
      requestId: `local-${Date.now()}`,
      routeKey: "$default",
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: body || undefined,
    isBase64Encoded: false,
  };
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const body = await readBody(req);
    const event = await toEvent(req, body);
    const result = await handler(event, {} as never, () => undefined);

    if (!result || typeof result === "string") {
      res.statusCode = 500;
      res.end("Invalid handler response");
      return;
    }

    res.statusCode = result.statusCode || 200;
    const outHeaders = result.headers || {};
    for (const [k, v] of Object.entries(outHeaders)) {
      if (v !== undefined && v !== null) res.setHeader(k, String(v));
    }
    if (!res.getHeader("Access-Control-Allow-Origin")) {
      res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
      res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    }
    res.end(result.body ?? "");
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Local server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);

  void import("./mail/smtp.js").then(({ mailConfigured }) => {
    console.log(
      mailConfigured()
        ? "[mail] SMTP ready — reminders + plan/withdraw emails on"
        : "[mail] SMTP not configured — set SMTP_HOST/USER/PASS in .env",
    );
  });

  // Duolingo-style study reminders: check every 60s for tasks starting in ~15 min
  const tickMs = Number(process.env.REMINDER_TICK_MS || 60_000);
  void import("./mail/reminders.js")
    .then(({ tickTaskReminders }) => {
      const run = () => {
        void tickTaskReminders()
          .then((r) => {
            if (r.sent > 0) {
              console.log(`[mail] reminders sent: ${r.sent} (checked ${r.checked})`);
            }
          })
          .catch((err) => console.error("[mail] reminder tick failed", err));
      };
      run();
      setInterval(run, tickMs);
      console.log(`Reminder ticker every ${tickMs / 1000}s`);
    })
    .catch((err) => console.error("[mail] reminder ticker not started", err));
});
