import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
import { HTTPError } from "@/shared/types";
import { getGuestbookService } from "@/server/services";
import { IGuestbook } from "@/server/models";
import { GuestbookListResponse } from "@/shared/schemas";
import { NextRequest } from "next/server";

// getGuestbookService가 이미 password/__v/updatedAt은 select에서 제외한다 —
// 여기선 응답 계약(GuestbookListResponse)에 맞춰 createdAt만 ISO 문자열로 명시 변환한다.
function toGuestbookListResponse(guestbooks: IGuestbook[]): GuestbookListResponse {
  return guestbooks.map(({ _id, coupleInfoId, author, message, isPrivate, createdAt }) => ({
    _id: _id.toString(),
    coupleInfoId: coupleInfoId.toString(),
    author,
    message,
    isPrivate,
    createdAt: new Date(createdAt).toISOString(),
  }));
}

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<GuestbookListResponse>> => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new HTTPError("coupleInfoId가 필요합니다.", 400);

    const guestbooks = await getGuestbookService(id);
    return apiOk(toGuestbookListResponse(guestbooks));
  } catch (e) {
    return apiFail(e);
  }
};
