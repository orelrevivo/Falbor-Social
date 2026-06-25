import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { follows, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

const me = new Hono();

// ─── GET /me ──────────────────────────────────────────────────────────────────

me.get("/", authMiddleware, async (c) => {
  const { sub } = c.get("user");

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      coverUrl: users.coverUrl,
      website: users.website,
      location: users.location,
      isVerified: users.isVerified,
      createdAt: users.createdAt,
      followersCount: sql<number>`(
        SELECT COUNT(*) FROM follows WHERE following_id = ${users.id}
      )::int`,
      followingCount: sql<number>`(
        SELECT COUNT(*) FROM follows WHERE follower_id = ${users.id}
      )::int`
    })
    .from(users)
    .where(eq(users.id, sub))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ me: user });
});

// ─── PATCH /me ────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  location: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  coverUrl: z.string().url().optional().or(z.literal(""))
});

me.patch("/", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const result = updateSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.flatten().fieldErrors }, 400);
  }

  const updates = Object.fromEntries(
    Object.entries(result.data).filter(([, v]) => v !== undefined)
  );

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  const [updated] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, sub))
    .returning({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      coverUrl: users.coverUrl,
      website: users.website,
      location: users.location
    });

  return c.json({ me: updated });
});

export { me };
