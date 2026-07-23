import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { HTTPError } from "@/shared/types";
import { requireAuth, getCoupleInfoById } from "@/server/services";
import { ICoupleInfo } from "@/server/models";
import { CoupleInfoResponse } from "@/shared/schemas";

import { NextRequest } from "next/server";

// getCoupleInfoById는 .lean() 원본을 그대로 준다(_id/userId가 ObjectId, weddingDate/createdAt/updatedAt이 Date) —
// NextResponse.json이 어차피 문자열로 직렬화하지만, 응답 타입(CoupleInfoResponse)과 실제로 맞춰서 명시한다.
function toCoupleInfoResponse(info: ICoupleInfo): CoupleInfoResponse {
  return {
    ...info,
    _id: info._id.toString(),
    userId: info.userId.toString(),
    weddingDate: info.weddingDate.toISOString(),
    createdAt: info.createdAt.toISOString(),
    updatedAt: info.updatedAt.toISOString(),
  };
}

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<CoupleInfoResponse>> => {
  try {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) throw new HTTPError("잘못된 접근 입니다.", 404);

    await requireAuth();

    const coupleInfo = await getCoupleInfoById(query);
    if (!coupleInfo) throw new HTTPError("커플 정보를 찾을 수 없습니다.", 404);

    return apiOk(toCoupleInfoResponse(coupleInfo));
  } catch (error) {
    return apiFail(error);
  }
};
