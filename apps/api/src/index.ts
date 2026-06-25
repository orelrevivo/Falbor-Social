import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./routes/auth.js";
import { me } from "./routes/me.js";
import { postsRouter } from "./routes/posts.js";
import { accounts } from "./routes/accounts.js";
import { notificationsRouter } from "./routes/notifications.js";
import { search } from "./routes/search.js";
import { aiRouter } from "./routes/ai.js";

import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use("/public/*", serveStatic({ root: "./" }));
app.use("*", logger());

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:4783",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true
  })
);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date() }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/auth", auth);
app.route("/me", me);
app.route("/posts", postsRouter);
app.route("/accounts", accounts);
app.route("/notifications", notificationsRouter);
app.route("/search", search);
app.route("/ai", aiRouter);

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

// ─── Start ────────────────────────────────────────────────────────────────────

import { startAgent } from "./agent/index.js";

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 API running on http://localhost:${port}`);
  
  // Start the autonomous AI agent
  startAgent().catch(err => console.error("Failed to start agent:", err));
});

export default app;
