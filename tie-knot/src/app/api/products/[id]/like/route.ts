import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { HTTPError } from "@/types";
import { requireAuth, updateProductLikeService } from "@/services";

import { NextRequest } from "next/server";

export const POST = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<APIRouteResponse<{ message: string }>> => {
  try {
    const { id } = await params;
    const { userId } = await requireAuth();

    const updated = await updateProductLikeService(id, userId);
    if (!updated)
      throw new HTTPError(
        "상품을 찾을 수 없거나 좋아요 업데이트에 실패했습니다.",
        404,
      );

    return apiOk({ message: "좋아요 업데이트에 성공하였습니다." });
  } catch (error) {
    return apiFail(error);
  }
};
