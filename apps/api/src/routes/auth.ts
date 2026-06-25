import { Hono } from "hono";
import { compare, hash } from "bcryptjs";
import { eq, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { refreshTokens, users } from "../db/schema.js";
import {
  hashToken,
  parseExpiryToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../lib/auth.js";
import { authMiddleware } from "../middleware/auth.js";

const auth = new Hono();

// ─── Register ─────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().max(100).optional()
});

auth.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.flatten().fieldErrors }, 400);
  }

  const { email, username, password, displayName } = result.data;

  // Check uniqueness
  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingEmail.length > 0) {
    return c.json({ error: { email: ["Email already in use"] } }, 409);
  }

  const existingUsername = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);

  if (existingUsername.length > 0) {
    return c.json({ error: { username: ["Username already taken"] } }, 409);
  }

  const passwordHash = await hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName: displayName ?? username,
      passwordHash
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt
    });

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    username: user.username
  };
  const accessToken = await signAccessToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: parseExpiryToDate(
      process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"
    )
  });

  return c.json({ user, accessToken, refreshToken }, 201);
});

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: result.error.flatten().fieldErrors }, 400);
  }

  const { email, password } = result.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    username: user.username
  };
  const accessToken = await signAccessToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: parseExpiryToDate(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d")
  });

  const { passwordHash: _, ...safeUser } = user;

  return c.json({ user: safeUser, accessToken, refreshToken });
});

// ─── Refresh ──────────────────────────────────────────────────────────────────

auth.post("/refresh", async (c) => {
  const body = await c.req.json().catch(() => null);
  const refreshToken = body?.refreshToken as string | undefined;

  if (!refreshToken) {
    return c.json({ error: "Refresh token required" }, 400);
  }

  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    return c.json({ error: "Invalid or expired refresh token" }, 401);
  }

  const tokenHash = hashToken(refreshToken);
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!stored || stored.expiresAt < new Date()) {
    return c.json({ error: "Refresh token revoked or expired" }, 401);
  }

  // Rotate refresh token
  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));

  const tokenPayload = {
    sub: payload.sub,
    email: payload.email,
    username: payload.username
  };
  const newAccessToken = await signAccessToken(tokenPayload);
  const newRefreshToken = await signRefreshToken(tokenPayload);

  await db.insert(refreshTokens).values({
    userId: payload.sub,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: parseExpiryToDate(process.env.JWT_REFRESH_EXPIRES_IN ?? "7d")
  });

  return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

auth.post("/logout", authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);
  const refreshToken = body?.refreshToken as string | undefined;

  if (refreshToken) {
    await db
      .delete(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashToken(refreshToken)));
  }

  return c.json({ success: true });
});

// ─── Logout All ───────────────────────────────────────────────────────────────

auth.post("/logout-all", authMiddleware, async (c) => {
  const user = c.get("user");
  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.userId, user.sub));
  return c.json({ success: true });
});

export { auth };
