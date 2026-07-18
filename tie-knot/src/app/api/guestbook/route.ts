import { APIRouteResponse, apiSuccess } from "@/api/response";
import { handleRouteError } from "@/api/error";
import { HTTPError } from "@/types/error";
import { getGuestbookService } from "@/services/guestbook.service";
import { IGuestbook } from "@/models/guestbook.model";
import { NextRequest } from "next/server";

export const GET = async (
  req: NextRequest,
): Promise<APIRouteResponse<IGuestbook[]>> => {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new HTTPError("coupleInfoId가 필요합니다.", 400);

    const guestbooks = await getGuestbookService(id);
    return apiSuccess(guestbooks);
  } catch (e) {
    return handleRouteError(e);
  }
};
