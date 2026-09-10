import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";

const COOKIE_NAME = "ag_session";

async function verifyJwt(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedPage = pathname.startsWith("/dashboard");
  const isProtectedApi = pathname.startsWith("/api/forms");

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifyJwt(token) : false;

  if (!valid) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/forms/:path*"],
};
