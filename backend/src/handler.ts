import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
} from "aws-lambda";
import { ZodError } from "zod";
import { getMethod, getPath, json, noContent } from "./http.js";
import {
  handleLogin,
  handleMe,
  handleUpdateAvatar,
} from "./routes/auth.js";
import { handleCreateNote, handleListNotes } from "./routes/encouragement.js";
import { handleExtract } from "./routes/extract.js";
import {
  handleConfirmPlan,
  handleGetToday,
  handleGetTomorrow,
} from "./routes/plans.js";
import { handleGetPhoto } from "./routes/photos.js";
import {
  handleGetEmonDashboard,
  handleGetPartnerToday,
  handleGetWeekProgress,
} from "./routes/progress.js";
import { handleClaimReward, handleFulfillReward } from "./routes/rewards.js";
import { handleToggleTask } from "./routes/tasks.js";
import { handleUpload } from "./routes/upload.js";

async function route(event: APIGatewayProxyEventV2) {
  const method = getMethod(event);
  const path = getPath(event).replace(/\/+$/, "") || "/";

  if (method === "OPTIONS") {
    return noContent(event);
  }

  if (method === "GET" && (path === "/" || path === "/health")) {
    return json(
      200,
      {
        ok: true,
        service: "arins-study-diary-api",
        ai: "bedrock",
        db: "mongodb-atlas",
      },
      event,
    );
  }

  if (method === "POST" && path === "/auth/login") {
    return handleLogin(event);
  }
  if (method === "GET" && path === "/auth/me") {
    return handleMe(event);
  }
  if (method === "POST" && path === "/auth/avatar") {
    return handleUpdateAvatar(event);
  }
  if (method === "POST" && path === "/extract") {
    return handleExtract(event);
  }
  if (method === "POST" && path === "/upload") {
    return handleUpload(event);
  }
  if (method === "POST" && path === "/plans/confirm") {
    return handleConfirmPlan(event);
  }
  if (method === "GET" && path === "/plans/today") {
    return handleGetToday(event);
  }
  if (method === "GET" && path === "/plans/tomorrow") {
    return handleGetTomorrow(event);
  }
  if (method === "PATCH" && path.startsWith("/tasks/")) {
    return handleToggleTask(event, path.slice("/tasks/".length));
  }
  if (method === "POST" && path === "/rewards/claim") {
    return handleClaimReward(event);
  }
  if (method === "POST" && path === "/rewards/fulfill") {
    return handleFulfillReward(event);
  }
  if (method === "GET" && path === "/rewards/week") {
    return handleGetWeekProgress(event);
  }
  if (method === "GET" && path === "/emon/dashboard") {
    return handleGetEmonDashboard(event);
  }
  if (method === "GET" && path === "/partner/today") {
    return handleGetPartnerToday(event);
  }
  if (method === "GET" && path === "/encouragement") {
    return handleListNotes(event);
  }
  if (method === "POST" && path === "/encouragement") {
    return handleCreateNote(event);
  }
  if (method === "GET" && path.startsWith("/photos/")) {
    return handleGetPhoto(event, path.slice("/photos/".length));
  }
  if (method === "POST" && path === "/internal/tick-reminders") {
    const secret = process.env.REMINDER_CRON_SECRET;
    const provided =
      event.headers["x-cron-secret"] || event.headers["X-Cron-Secret"];
    if (secret && provided !== secret) {
      return json(401, { error: "Unauthorized" }, event);
    }
    const { tickTaskReminders } = await import("./mail/reminders.js");
    const result = await tickTaskReminders();
    return json(200, { ok: true, ...result }, event);
  }

  return json(404, { error: `No route for ${method} ${path}` }, event);
}

function isHttpApiEvent(event: unknown): event is APIGatewayProxyEventV2 {
  return (
    typeof event === "object" &&
    event !== null &&
    "requestContext" in event &&
    typeof (event as { requestContext?: { http?: unknown } }).requestContext
      ?.http === "object"
  );
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // EventBridge schedule → reminder tick (no API Gateway envelope)
    if (!isHttpApiEvent(event)) {
      const { tickTaskReminders } = await import("./mail/reminders.js");
      const result = await tickTaskReminders();
      console.log("[mail] scheduled reminder tick", result);
      return json(200, { ok: true, source: "schedule", ...result });
    }

    return await route(event);
  } catch (err) {
    if (err instanceof ZodError) {
      return json(400, { error: "Invalid request body" }, event as APIGatewayProxyEventV2);
    }
    const statusCode =
      typeof err === "object" &&
      err !== null &&
      "statusCode" in err &&
      typeof (err as { statusCode: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;
    const message = err instanceof Error ? err.message : "Server error";
    const mongoHint =
      /mongodb|timed out|ECONNREFUSED|Server selection/i.test(message)
        ? " MongoDB Atlas Network Access must allow 0.0.0.0/0 for Lambda."
        : "";
    console.error("[api]", message);
    return json(
      statusCode,
      {
        error:
          statusCode === 500
            ? `Server error.${mongoHint}`
            : `${message}${mongoHint}`,
      },
      isHttpApiEvent(event) ? event : undefined,
    );
  }
};
