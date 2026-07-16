import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { deleteCookie } from "@/lib/cookies/delete";

export const DELETE = async (): Promise<
  APIRouteResponse<{ message: string }>
> => {
  try {
    await deleteCookie("userEmail");
    return apiSuccess({ message: "로그아웃에 성공하였습니다." });
  } catch (e) {
    return handleRouteError(e);
  }
};
