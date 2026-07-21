import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { HTTPError } from "@/types";
import { requireAuth, getCoupleInfoById } from "@/services";
import { ICoupleInfo } from "@/models";

import { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<ICoupleInfo>> => {
  try {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) throw new HTTPError("잘못된 접근 입니다.", 404);

    await requireAuth();

    const coupleInfo = await getCoupleInfoById(query);
    if (!coupleInfo) throw new HTTPError("커플 정보를 찾을 수 없습니다.", 404);

    return apiOk(coupleInfo);
  } catch (error) {
    return apiFail(error);
  }
};
