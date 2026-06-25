import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { follows, notifications, posts, users, votes } from "../db/schema.js";
import {
  authMiddleware,
  optionalAuthMiddleware
} from "../middleware/auth.js";

const accounts = new Hono();

// Helper: safe user select
const userSelect = (currentUserId?: string) => ({
  id: users.id,
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
  )::int`,
  postsCount: sql<number>`(
    SELECT COUNT(*) FROM posts WHERE author_id = ${users.id}
  )::int`,
  isFollowing: currentUserId
    ? sql<boolean>`EXISTS(
        SELECT 1 FROM follows
        WHERE follower_id = ${currentUserId} AND following_id = ${users.id}
      )`
    : sql<boolean>`false`
});

// ─── GET /accounts/:username ──────────────────────────────────────────────────

accounts.get("/:username", optionalAuthMiddleware, async (c) => {
  const currentUser = c.var.user;
  const { username } = c.req.param();

  const [user] = await db
    .select(userSelect(currentUser?.sub))
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({ account: user });
});

// ─── GET /accounts/:username/posts ────────────────────────────────────────────

accounts.get("/:username/posts", optionalAuthMiddleware, async (c) => {
  const currentUser = c.var.user;
  const { username } = c.req.param();
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);

  if (!user) return c.json({ error: "User not found" }, 404);

  const items = await db
    .select({
      id: posts.id,
      content: posts.content,
      mediaUrls: posts.mediaUrls,
      parentId: posts.parentId,
      repostOfId: posts.repostOfId,
      createdAt: posts.createdAt,
      author: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        isVerified: users.isVerified
      },
      score: sql<number>`(SELECT COALESCE(SUM(value), 0) FROM votes WHERE post_id = ${posts.id})::int`,
      upvotesCount: sql<number>`(SELECT COUNT(*) FROM votes WHERE post_id = ${posts.id} AND value = 1)::int`,
      downvotesCount: sql<number>`(SELECT COUNT(*) FROM votes WHERE post_id = ${posts.id} AND value = -1)::int`,
      commentsCount: sql<number>`(SELECT COUNT(*) FROM posts p2 WHERE p2.parent_id = ${posts.id})::int`,
      repostsCount: sql<number>`(SELECT COUNT(*) FROM posts p3 WHERE p3.repost_of_id = ${posts.id})::int`,
      userVote: currentUser?.sub
        ? sql<number>`COALESCE((SELECT value FROM votes WHERE user_id = ${currentUser.sub} AND post_id = ${posts.id}), 0)::int`
        : sql<number>`0`,
      hasBookmarked: currentUser?.sub
        ? sql<boolean>`EXISTS(SELECT 1 FROM bookmarks WHERE user_id = ${currentUser.sub} AND post_id = ${posts.id})`
        : sql<boolean>`false`
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(
      cursor
        ? and(eq(posts.authorId, user.id), sql`${posts.createdAt} < ${new Date(cursor)}`)
        : eq(posts.authorId, user.id)
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  const nextCursor =
    items.length === limit
      ? items[items.length - 1].createdAt.toISOString()
      : null;

  return c.json({ items, nextCursor });
});

// ─── POST /accounts/:username/follow ──────────────────────────────────────────

accounts.post("/:username/follow", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const { username } = c.req.param();

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);

  if (!target) return c.json({ error: "User not found" }, 404);
  if (target.id === sub) return c.json({ error: "Cannot follow yourself" }, 400);

  const [existing] = await db
    .select()
    .from(follows)
    .where(
      and(eq(follows.followerId, sub), eq(follows.followingId, target.id))
    )
    .limit(1);

  if (existing) {
    await db
      .delete(follows)
      .where(
        and(eq(follows.followerId, sub), eq(follows.followingId, target.id))
      );
    return c.json({ following: false });
  }

  await db.insert(follows).values({ followerId: sub, followingId: target.id });

  await db.insert(notifications).values({
    userId: target.id,
    type: "follow",
    actorId: sub
  });

  return c.json({ following: true });
});

export { accounts };
