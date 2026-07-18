import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/token";

/**
 * 특정 도메인 접속 시 권한 체크
 * Auth && User
 */

export default async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const tokenCookie = request.cookies.get("token");

    // 인증 필요 라우트 보호 (로그인 유저만)
    const protectedPaths = ["/order", "/profile", "/couple-info", "/payment", "/delivery-info"];
    if (protectedPaths.some((p) => pathname.startsWith(p))) {
      if (!tokenCookie?.value) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return NextResponse.next();
    }

    // 어드민 라우트 보호
    if (pathname.startsWith("/admin")) {
      if (!tokenCookie?.value) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      const { payload } = await decrypt({
        token: tokenCookie.value,
        type: "REFRESH",
      });

      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    }

    // 이미 로그인한 유저는 auth 페이지 접근 불가
    if (tokenCookie?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/login" && !request.cookies.has("entry")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/change-pw" && !request.nextUrl.searchParams.get("t")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch (e) {
    console.error("Middleware error:", e);
    return NextResponse.redirect(new URL("/", request.url));
  }
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
