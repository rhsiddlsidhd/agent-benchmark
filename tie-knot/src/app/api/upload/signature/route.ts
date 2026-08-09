import { NextRequest } from "next/server";
import { APIRouteResponse, routeSuccess, routeError } from "@/server/boundary";
import { AppError } from "@/shared/types";
import { requireAuth } from "@/server/services";
import { signUploadRequest, UploadSignature } from "@/server/lib/cloudinary";

export const POST = async (
  request: NextRequest,
): Promise<APIRouteResponse<UploadSignature>> => {
  try {
    await requireAuth();

    const { folder } = await request.json();

    if (!folder) {
      throw new AppError("VALIDATION", "folder 파라미터가 필요합니다.");
    }

    return routeSuccess(signUploadRequest(folder));
  } catch (error) {
    return routeError(error);
  }
};
