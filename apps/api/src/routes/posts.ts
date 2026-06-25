import { Hono } from "hono";
import { and, desc, eq, isNull, sql, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  bookmarks,
  follows,
  votes,
  notifications,
  posts,
  users
} from "../db/schema.js";
import {
  authMiddleware,
  optionalAuthMiddleware
} from "../middleware/auth.js";

const postsRouter = new Hono();

// Helper: build the standard post select
const postSelect = (currentUserId?: string) => ({
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
  score: sql<number>`(
    SELECT COALESCE(SUM(value), 0) FROM votes WHERE post_id = ${posts.id}
  )::int`,
  upvotesCount: sql<number>`(
    SELECT COUNT(*) FROM votes WHERE post_id = ${posts.id} AND value = 1
  )::int`,
  downvotesCount: sql<number>`(
    SELECT COUNT(*) FROM votes WHERE post_id = ${posts.id} AND value = -1
  )::int`,
  commentsCount: sql<number>`(
    SELECT COUNT(*) FROM posts p2 WHERE p2.parent_id = ${posts.id}
  )::int`,
  repostsCount: sql<number>`(
    SELECT COUNT(*) FROM posts p3 WHERE p3.repost_of_id = ${posts.id}
  )::int`,
  bookmarksCount: sql<number>`(
    SELECT COUNT(*) FROM bookmarks WHERE post_id = ${posts.id}
  )::int`,
  userVote: currentUserId
    ? sql<number>`COALESCE((SELECT value FROM votes WHERE user_id = ${currentUserId} AND post_id = ${posts.id}), 0)::int`
    : sql<number>`0`,
  hasBookmarked: currentUserId
    ? sql<boolean>`EXISTS(
        SELECT 1 FROM bookmarks WHERE user_id = ${currentUserId} AND post_id = ${posts.id}
      )`
    : sql<boolean>`false`
});

// ─── GET /posts (public feed / explore) ──────────────────────────────────────

postsRouter.get("/", optionalAuthMiddleware, async (c) => {
  const currentUser = c.var.user;
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);

  const query = db
    .select(postSelect(currentUser?.sub))
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(isNull(posts.parentId))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  const items = cursor
    ? await query.where(
        and(isNull(posts.parentId), sql`${posts.createdAt} < ${new Date(cursor)}`)
      )
    : await query;

  const nextCursor =
    items.length === limit
      ? items[items.length - 1].createdAt.toISOString()
      : null;

  return c.json({ items, nextCursor });
});

// ─── GET /posts/timeline (following feed) ─────────────────────────────────────

postsRouter.get("/timeline", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);

  const items = await db
    .select(postSelect(sub))
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .leftJoin(
      follows,
      and(eq(follows.followingId, posts.authorId), eq(follows.followerId, sub))
    )
    .where(
      and(
        or(eq(posts.authorId, sub), sql`${follows.followerId} IS NOT NULL`),
        cursor
          ? and(isNull(posts.parentId), sql`${posts.createdAt} < ${new Date(cursor)}`)
          : isNull(posts.parentId)
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  const nextCursor =
    items.length === limit
      ? items[items.length - 1].createdAt.toISOString()
      : null;

  return c.json({ items, nextCursor });
});

// ─── GET /posts/:id ───────────────────────────────────────────────────────────

postsRouter.get("/:id", optionalAuthMiddleware, async (c) => {
  const currentUser = c.var.user;
  const { id } = c.req.param();

  const [post] = await db
    .select(postSelect(currentUser?.sub))
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }

  // Fetch comments
  const comments = await db
    .select(postSelect(currentUser?.sub))
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.parentId, id))
    .orderBy(desc(posts.createdAt))
    .limit(20);

  return c.json({ post, comments });
});

// ─── POST /posts ──────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).max(8).optional(),
  parentId: z.string().uuid().optional(),
  repostOfId: z.string().uuid().optional()
});

postsRouter.post("/", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const body = await c.req.json().catch(() => null);
  const result = createPostSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: result.error.flatten().fieldErrors }, 400);
  }

  const { content, mediaUrls, parentId, repostOfId } = result.data;

  // Validate parent exists
  if (parentId) {
    const [parent] = await db
      .select({ id: posts.id, authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, parentId))
      .limit(1);
    if (!parent) {
      return c.json({ error: "Parent post not found" }, 404);
    }
    // Notify parent author
    if (parent.authorId !== sub) {
      await db.insert(notifications).values({
        userId: parent.authorId,
        type: "comment",
        actorId: sub,
        postId: parentId
      });
    }
  }

  const [post] = await db
    .insert(posts)
    .values({ authorId: sub, content, mediaUrls, parentId, repostOfId })
    .returning();

  // Extract mentions (e.g. @username)
  const mentionRegex = /@([\w.-]+)/g;
  const mentions = [...content.matchAll(mentionRegex)].map(m => m[1]);
  
  if (mentions.length > 0) {
    // Deduplicate mentions
    const uniqueMentions = [...new Set(mentions)];
    
    // Find user IDs for the mentioned usernames
    // Note: In a large scale app, we might limit this, but here we check all
    for (const username of uniqueMentions) {
      const [mentionedUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username.toLowerCase()))
        .limit(1);
        
      if (mentionedUser && mentionedUser.id !== sub) {
        // Create mention notification
        await db.insert(notifications).values({
          userId: mentionedUser.id,
          type: "mention",
          actorId: sub,
          postId: post.id
        });
      }
    }
  }

  return c.json({ post }, 201);
});

// ─── DELETE /posts/:id ────────────────────────────────────────────────────────

postsRouter.delete("/:id", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const { id } = c.req.param();

  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post) return c.json({ error: "Post not found" }, 404);
  if (post.authorId !== sub)
    return c.json({ error: "Forbidden" }, 403);

  await db.delete(posts).where(eq(posts.id, id));
  return c.json({ success: true });
});

// ─── POST /posts/:id/vote ─────────────────────────────────────────────────────

postsRouter.post("/:id/vote", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const { id } = c.req.param();
  const body = await c.req.json().catch(() => null);
  
  if (!body || typeof body.value !== 'number' || ![0, 1, -1].includes(body.value)) {
    return c.json({ error: "Invalid vote value" }, 400);
  }
  
  const value = body.value;

  const [post] = await db
    .select({ id: posts.id, authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (!post) return c.json({ error: "Post not found" }, 404);

  const [existing] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, sub), eq(votes.postId, id)))
    .limit(1);

  if (value === 0) {
    if (existing) {
      await db
        .delete(votes)
        .where(and(eq(votes.userId, sub), eq(votes.postId, id)));
    }
    return c.json({ voted: 0 });
  }

  if (existing) {
    if (existing.value !== value) {
      await db
        .update(votes)
        .set({ value })
        .where(and(eq(votes.userId, sub), eq(votes.postId, id)));
    }
  } else {
    await db.insert(votes).values({ userId: sub, postId: id, value });
    
    // Notify on upvote
    if (value === 1 && post.authorId !== sub) {
      await db.insert(notifications).values({
        userId: post.authorId,
        type: "upvote",
        actorId: sub,
        postId: id
      });
    }
  }

  return c.json({ voted: value });
});

// ─── POST /posts/:id/bookmark ─────────────────────────────────────────────────

postsRouter.post("/:id/bookmark", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const { id } = c.req.param();

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  if (!post) return c.json({ error: "Post not found" }, 404);

  const [existing] = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, sub), eq(bookmarks.postId, id)))
    .limit(1);

  if (existing) {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, sub), eq(bookmarks.postId, id)));
    return c.json({ bookmarked: false });
  }

  await db.insert(bookmarks).values({ userId: sub, postId: id });
  return c.json({ bookmarked: true });
});

// ─── GET /posts/bookmarks (current user's bookmarks) ──────────────────────────

postsRouter.get("/bookmarks/mine", authMiddleware, async (c) => {
  const { sub } = c.get("user");
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 50);

  const items = await db
    .select(postSelect(sub))
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(
      bookmarks,
      and(eq(bookmarks.postId, posts.id), eq(bookmarks.userId, sub))
    )
    .where(
      cursor ? sql`${bookmarks.createdAt} < ${new Date(cursor)}` : undefined
    )
    .orderBy(desc(bookmarks.createdAt))
    .limit(limit);

  const nextCursor =
    items.length === limit
      ? items[items.length - 1].createdAt.toISOString()
      : null;

  return c.json({ items, nextCursor });
});

export { postsRouter };
