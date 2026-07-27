import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/server/lib/jose";
import { routes } from "@/shared/constants";

/**
 * 특정 도메인 접속 시 권한 체크
 * Auth && User
 */

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get("token");

  const protectedPaths = [
    routes.myOrders.root,
    routes.profile,
    routes.coupleInfo,
    routes.payment.root,
    routes.deliveryInfo,
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith("/admin");

  if (isProtected || isAdmin) {
    if (!tokenCookie?.value) {
      return NextResponse.redirect(new URL(routes.login, request.url));
    }

    try {
      const { payload } = await decrypt({ token: tokenCookie.value, type: "REFRESH" });

      if (isAdmin && payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL(routes.home, request.url));
      }

      return NextResponse.next();
    } catch (e) {
      console.error("Proxy error:", e);
      return NextResponse.redirect(new URL(routes.login, request.url));
    }
  }

  // 이미 로그인한 유저는 auth 페이지 접근 불가
  if (tokenCookie?.value) {
    return NextResponse.redirect(new URL(routes.home, request.url));
  }

  if (pathname === routes.changePw && !request.nextUrl.searchParams.get("t")) {
    return NextResponse.redirect(new URL(routes.home, request.url));
  }

  return NextResponse.next();
}

// matcher는 Next.js가 build-time에 정적 분석한다 — 변수/상수 참조는 무시되고
// 리터럴만 인식되므로(node_modules/next/dist/docs 공식 문서) 여기는 routes.*로
// 옮기지 않고 문자열 그대로 둔다.
export const config = {
  matcher: [
    "/find-id",
    "/find-pw",
    "/signup",
    "/login",
    "/change-pw",
    "/admin/:path*",
    "/my-orders/:path*",
    "/my-orders",
    "/profile",
    "/couple-info",
    "/payment/:path*",
    "/delivery-info",
  ],
};
