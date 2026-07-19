import { UserModel, UserRole } from "@/models/user.model";
import { dbConnect } from "@/lib/mongodb";
import { getCookie, setCookie, deleteCookie } from "@/lib/cookies";
import { decrypt, encrypt } from "@/lib/jose";
import mongoose from "mongoose";
import { AuthSession, HTTPError } from "@/types";

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

// access 쿠키(빠른 경로, DB 조회 없이 검증)를 우선 확인하고, 없거나 만료됐으면
// refresh 쿠키(느린 경로)로 재발급한 뒤 access 쿠키를 갱신한다.
export async function getAuth(): Promise<AuthResult> {
  const accessCookie = await getCookie("access");

  if (accessCookie?.value) {
    try {
      const { payload } = await decrypt({
        token: accessCookie.value,
        type: "ACCESS",
      });

      if (payload.id) {
        const user = await getUser({ id: payload.id });
        if (user) {
          return {
            role: user.role,
            email: user.email,
            userId: user._id.toString(),
          };
        }
      }
    } catch {
      // access 쿠키가 만료/무효 — 아래 refresh 경로로 폴백
    }
  }

  try {
    const refreshCookie = await getCookie("token");
    const refreshToken = refreshCookie?.value;

    if (!refreshToken) {
      return null;
    }

    const { payload } = await decrypt({ token: refreshToken, type: "REFRESH" });

    if (!payload.id) {
      return null;
    }

    const user = await getUser({ id: payload.id });

    if (!user) {
      return null;
    }

    const accessToken = await encrypt({
      id: user._id.toString(),
      role: user.role,
      type: "ACCESS",
    });

    await setCookie({ name: "access", value: accessToken });

    return {
      role: user.role,
      email: user.email,
      userId: user._id.toString(),
    };
  } catch {
    return null;
  }
}

// 인증이 반드시 필요한 Route Handler에서 호출한다 — 세션이 없으면 401을 throw한다.
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuth();
  if (!session) {
    throw new HTTPError("인증이 필요합니다.", 401);
  }
  return session;
}

/**
 * 로그아웃 처리를 위해 서버의 인증 토큰 쿠키를 삭제합니다.
 */
export async function logoutService() {
  await deleteCookie("token");
  await deleteCookie("access");
}
