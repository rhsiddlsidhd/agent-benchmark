import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { decrypt } from "@/lib/token";
import { ICoupleInfo } from "@/models/coupleInfo.model";
import { getCoupleInfoById } from "@/services/coupleInfo.service";
import { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<ICoupleInfo>> => {
  try {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) throw new HTTPError("잘못된 접근 입니다.", 404);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPError("인증 토큰이 필요합니다.", 401);
    }

    const token = authHeader.substring(7);
    const { payload } = await decrypt({ token, type: "ACCESS" });

    if (!payload.id) {
      throw new HTTPError("유효하지 않은 토큰입니다.", 401);
    }
    const coupleInfo = await getCoupleInfoById(query);
    if (!coupleInfo) throw new HTTPError("커플 정보를 찾을 수 없습니다.", 404);

    return apiSuccess(coupleInfo);
  } catch (error) {
    return handleRouteError(error);
  }
};
