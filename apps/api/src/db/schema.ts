import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const notificationTypeEnum = pgEnum("notification_type", [
  "like",
  "upvote",
  "comment",
  "follow",
  "repost",
  "mention"
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    website: text("website"),
    location: varchar("location", { length: 100 }),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_username_idx").on(t.username)
  ]
);

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (t) => [index("refresh_tokens_user_idx").on(t.userId)]
);

// ─── Posts ────────────────────────────────────────────────────────────────────

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    mediaUrls: text("media_urls").array().notNull().default([]),
    // parentId: if set, this is a comment on another post
    parentId: uuid("parent_id").references((): any => posts.id, {
      onDelete: "cascade"
    }),
    // repostOfId: if set, this is a repost
    repostOfId: uuid("repost_of_id").references((): any => posts.id, {
      onDelete: "cascade"
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow()
  },
  (t) => [
    index("posts_author_idx").on(t.authorId),
    index("posts_parent_idx").on(t.parentId),
    index("posts_created_at_idx").on(t.createdAt)
  ]
);

// ─── Votes ────────────────────────────────────────────────────────────────────

export const votes = pgTable(
  "votes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.postId] }),
    index("votes_post_idx").on(t.postId)
  ]
);

// ─── Follows ──────────────────────────────────────────────────────────────────

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follows_following_idx").on(t.followingId)
  ]
);

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.postId] }),
    index("bookmarks_user_idx").on(t.userId)
  ]
);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow()
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    index("notifications_read_idx").on(t.userId, t.read)
  ]
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
