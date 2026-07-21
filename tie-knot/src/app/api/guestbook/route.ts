import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { HTTPError } from "@/types";
import { getGuestbookService } from "@/services";
import { IGuestbook } from "@/models";
import { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<IGuestbook[]>> => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new HTTPError("coupleInfoId가 필요합니다.", 400);

    const guestbooks = await getGuestbookService(id);
    return apiOk(guestbooks);
  } catch (e) {
    return apiFail(e);
  }
};
