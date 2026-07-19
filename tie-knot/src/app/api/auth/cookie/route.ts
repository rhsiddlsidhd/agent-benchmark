import { APIRouteResponse, apiOk, apiFail } from "@/api/response";
import { deleteCookie } from "@/lib/cookies";

export const DELETE = async (): Promise<
  APIRouteResponse<{ message: string }>
> => {
  try {
    await deleteCookie("userEmail");
    return apiOk({ message: "로그아웃에 성공하였습니다." });
  } catch (e) {
    return apiFail(e);
  }
};
