import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { decrypt } from "@/lib/token";
import { NextRequest } from "next/server";

export const POST = async (
  req: NextRequest,
): Promise<APIRouteResponse<{ valid: boolean }>> => {
  try {
    // Authorization 헤더에서 토큰 추출

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPError("인증 토큰이 필요합니다.", 401);
    }

    const token = authHeader.substring(7);
    const { payload } = await decrypt({ token, type: "ACCESS" });

    if (!payload.id) {
      throw new HTTPError("유효하지 않은 토큰입니다.", 401);
    }

    return apiSuccess({ valid: true });
  } catch (e) {
    return handleRouteError(e);
  }
};
