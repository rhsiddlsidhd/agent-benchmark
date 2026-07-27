import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/server/lib/jose";

/**
 * 특정 도메인 접속 시 권한 체크
 * Auth && User
 */

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get("token");

  const protectedPaths = ["/order", "/profile", "/couple-info", "/payment", "/delivery-info"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith("/admin");

  if (isProtected || isAdmin) {
    if (!tokenCookie?.value) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await decrypt({ token: tokenCookie.value, type: "REFRESH" });

      if (isAdmin && payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    } catch (e) {
      console.error("Proxy error:", e);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 이미 로그인한 유저는 auth 페이지 접근 불가
  if (tokenCookie?.value) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/change-pw" && !request.nextUrl.searchParams.get("t")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/find-id",
    "/find-pw",
    "/signup",
    "/login",
    "/change-pw",
    "/admin/:path*",
    "/order/:path*",
    "/order",
    "/profile",
    "/couple-info",
    "/payment",
    "/delivery-info",
  ],
};
