import { createMiddleware } from "hono/factory";
import { verifyAccessToken, type JwtPayload } from "../lib/auth.js";

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = await verifyAccessToken(authHeader.slice(7));
      c.set("user", payload);
    } catch {
      // silently ignore — optional auth
    }
  }
  await next();
});
