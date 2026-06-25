import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications, posts, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const notificationsRouter = new Hono();

// ─── GET /notifications ───────────────────────────────────────────────────────

notificationsRouter.get("/", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);

  const actor = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl
    })
    .from(users)
    .as("actor");

  const items = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      read: notifications.read,
      createdAt: notifications.createdAt,
      postId: notifications.postId,
      actor: {
        id: actor.id,
        username: actor.username,
        displayName: actor.displayName,
        avatarUrl: actor.avatarUrl
      }
    })
    .from(notifications)
    .innerJoin(actor, eq(notifications.actorId, actor.id))
    .where(
      cursor
        ? and(
            eq(notifications.userId, sub),
            desc(notifications.createdAt) // applied below via orderBy
          )
        : eq(notifications.userId, sub)
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return c.json({ items });
});

// ─── POST /notifications/mark-read ────────────────────────────────────────────

notificationsRouter.post("/mark-read", authMiddleware, async (c) => {
  const { sub } = c.get("user");

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(eq(notifications.userId, sub), eq(notifications.read, false))
    );

  return c.json({ success: true });
});

// ─── GET /notifications/unread-count ──────────────────────────────────────────

notificationsRouter.get("/unread-count", authMiddleware, async (c) => {
  const { sub } = c.get("user");

  const [result] = await db
    .select({
      count: db.$count(notifications, and(
        eq(notifications.userId, sub),
        eq(notifications.read, false)
      ))
    })
    .from(notifications)
    .where(and(eq(notifications.userId, sub), eq(notifications.read, false)));

  return c.json({ count: Number(result?.count ?? 0) });
});

export { notificationsRouter };
