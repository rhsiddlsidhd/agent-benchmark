import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { logoutService } from "@/server/services";
/**
 * 로그아웃 API (인증 토큰 쿠키 삭제)
 */
export const DELETE = async (): Promise<
  APIRouteResponse<{ message: string }>
> => {
  try {
    await logoutService();
    return apiOk({ message: "로그아웃에 성공하였습니다." });
  } catch (e) {
    return apiFail(e);
  }
};
