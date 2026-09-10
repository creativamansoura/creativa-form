import jwt from "jsonwebtoken";
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "ag_session";
const EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("Please define JWT_SECRET in your .env.local file");
}

export interface JwtPayload {
  adminId: string;
}

export function signToken(adminId: string): string {
  return jwt.sign({ adminId } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/** Edge-compatible token verification using `jose` (for use in middleware.ts only) */
export async function verifyTokenEdge(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return { adminId: payload["adminId"] as string };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
