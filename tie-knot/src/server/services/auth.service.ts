import { UserModel, UserRole } from "@/server/models";
import { dbConnect } from "@/server/lib/mongodb";
import { getCookie, deleteCookie } from "@/server/lib/cookies";
import { decrypt } from "@/server/lib/jose";
import mongoose from "mongoose";
import { AppError } from "@/shared/types";
import { AuthSession } from "@/shared/schemas";
import { cache } from "react";
import { redirect } from "next/navigation";
import { routes } from "@/shared/constants";

export type LeanUser = {
  email: string;
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  isDelete: boolean;
  _id: string; // MongoDB id
};

type UserQuery = { email?: string; id?: string };

type UserFilter = {
  isDelete: boolean;
  email?: string;
  _id?: mongoose.Types.ObjectId;
};

export const getUser = async (query: UserQuery): Promise<LeanUser | null> => {
  await dbConnect();

  const filter: UserFilter = { isDelete: false };

  if (query.email) filter.email = query.email;
  if (query.id) {
    if (!mongoose.Types.ObjectId.isValid(query.id)) return null;
    filter._id = new mongoose.Types.ObjectId(query.id);
  }

  const user = await UserModel.findOne(filter)
    .select("_id email name phone password role isDelete")
    .lean<LeanUser>();

  return user;
};

export type AuthResult = AuthSession | null;

export async function getAuth(): Promise<AuthResult> {
  const cookie = await getCookie("token");
  if (!cookie?.value) return null;

  try {
    const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });
    if (!payload.id) return null;

    const user = await getUser({ id: payload.id });
    if (!user) return null;

    return { role: user.role, email: user.email, userId: user._id.toString() };
  } catch {
    return null;
  }
}

// 인증이 반드시 필요한 Route Handler/Server Action에서 호출한다 — 세션이 없으면 UNAUTHENTICATED를 throw한다.
// HTTP status(401)로의 번역은 route.ts 경계(`response.ts`)가 담당한다.
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuth();
  if (!session) {
    throw new AppError("UNAUTHENTICATED", "인증이 필요합니다.");
  }
  return session;
}

/**
 * 로그아웃 처리를 위해 서버의 인증 토큰 쿠키를 삭제합니다.
 */
export async function logoutService() {
  await deleteCookie("token");
}

// page.tsx(Server Component render) 전용 라우팅 게이트 — requireAuth()(throw)와 달리
// 실패를 곧바로 redirect로 처리한다. 인증 확인이 role 확인보다 먼저 와야 한다 — 순서를
// 바꾸면 미인증 유저가 role-mismatch(/)로 오분류돼 재로그인 유도(/login)를 못 받는다.
// cache()로 감싸 같은 렌더 패스 안 반복 호출(page 게이트 + service 재확인)이 세션을
// 중복 조회하지 않게 한다(docs/PAGE_ACCESS_CONTROL.md 참고).
export const verifySession = cache(async (requiredRole?: UserRole): Promise<AuthSession> => {
  const session = await getAuth();
  if (!session) {
    redirect(routes.login);
  }
  if (requiredRole && session.role !== requiredRole) {
    redirect(routes.home);
  }
  return session;
});
