import { Hono } from "hono";
import { ilike, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { posts, users, votes, bookmarks } from "../db/schema.js";
import { optionalAuthMiddleware } from "../middleware/auth.js";

const search = new Hono();

search.get("/", optionalAuthMiddleware, async (c) => {
  const currentUser = c.var.user;
  const q = c.req.query("q")?.trim();
  const type = c.req.query("type") ?? "all"; // "all" | "accounts" | "posts"

  if (!q || q.length < 1) {
    return c.json({ accounts: [], posts: [] });
  }

  const pattern = `%${q}%`;

  const foundAccounts =
    type === "posts"
      ? []
      : await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            bio: users.bio,
            avatarUrl: users.avatarUrl,
            isVerified: users.isVerified
          })
          .from(users)
          .where(
            or(
              ilike(users.username, pattern),
              ilike(users.displayName, pattern),
              ilike(users.bio, pattern)
            )
          )
          .limit(10);

  const foundPosts =
    type === "accounts"
      ? []
      : await db
          .select({
            id: posts.id,
            content: posts.content,
            mediaUrls: posts.mediaUrls,
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
            bookmarksCount: sql<number>`(SELECT COUNT(*) FROM bookmarks WHERE post_id = ${posts.id})::int`,
            userVote: currentUser?.sub
              ? sql<number>`COALESCE((SELECT value FROM votes WHERE user_id = ${currentUser.sub} AND post_id = ${posts.id}), 0)::int`
              : sql<number>`0`,
            hasBookmarked: currentUser?.sub
              ? sql<boolean>`EXISTS(SELECT 1 FROM bookmarks WHERE user_id = ${currentUser.sub} AND post_id = ${posts.id})`
              : sql<boolean>`false`
          })
          .from(posts)
          .innerJoin(users, sql`posts.author_id = users.id`)
          .where(ilike(posts.content, pattern))
          .limit(20);

  return c.json({ accounts: foundAccounts, posts: foundPosts });
});

export { search };
