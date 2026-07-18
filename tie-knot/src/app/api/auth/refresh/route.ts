import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { getCookie } from "@/lib/cookies/get";
import { deleteCookie } from "@/lib/cookies/delete";
import { decrypt, encrypt } from "@/lib/token";
import { UserRole } from "@/models/user.model";
import { getUser } from "@/services/auth.service";

export const POST = async (): Promise<
  APIRouteResponse<{ accessToken: string; role: UserRole; email: string; userId: string }>
> => {
  // 리프레쉬 토큰 유효성 검사 이후 Access token 발행
  try {
    const cookie = await getCookie("token");
    const refreshToken = cookie?.value;

    if (!refreshToken) {
      throw new HTTPError("인증 토큰이 누락되었습니다.", 401);
    }

    const { payload } = await decrypt({ token: refreshToken, type: "REFRESH" });

    if (!payload.id) throw new HTTPError("유효하지 않은 토큰입니다.", 401);

    const user = await getUser({ id: payload.id });

    if (!user) throw new HTTPError("사용자를 찾을 수가 없습니다.", 400);

    const accessToken = await encrypt({
      id: user._id.toString(),
      role: user.role,
      type: "ACCESS",
    });

    return apiSuccess({
      accessToken,
      role: user.role,
      email: user.email,
      userId: user._id.toString(),
    });
  } catch (e) {
    // refresh token이 만료되거나 유효하지 않을 경우 쿠키 삭제
    await deleteCookie("token");
    return handleRouteError(e);
  }
};
