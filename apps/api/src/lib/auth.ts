import { SignJWT, jwtVerify } from "jose";
import { createHash } from "node:crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET!
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

export interface JwtPayload {
  sub: string; // user id
  email: string;
  username: string;
}

export const signAccessToken = (payload: JwtPayload): Promise<string> =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

export const signRefreshToken = (payload: JwtPayload): Promise<string> =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_REFRESH_EXPIRES_IN)
    .sign(JWT_REFRESH_SECRET);

export const verifyAccessToken = async (
  token: string
): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as unknown as JwtPayload;
};

export const verifyRefreshToken = async (
  token: string
): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
  return payload as unknown as JwtPayload;
};

/** Hash a refresh token for safe DB storage */
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

/** Parse expiry string like "7d", "15m", "1h" into a future Date */
export const parseExpiryToDate = (expiry: string): Date => {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const ms =
    unit === "d"
      ? value * 86_400_000
      : unit === "h"
        ? value * 3_600_000
        : value * 60_000;
  return new Date(Date.now() + ms);
};
