import { UserModel, UserRole } from "@/server/models";
import { dbConnect } from "@/server/lib/mongodb";
import { getCookie, deleteCookie } from "@/server/lib/cookies";
import { decrypt } from "@/server/lib/jose";
import mongoose from "mongoose";
import { AppError } from "@/shared/types";
import { AuthSession } from "@/shared/schemas";

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
