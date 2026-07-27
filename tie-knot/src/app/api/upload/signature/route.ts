import { NextRequest } from "next/server";
import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
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

    return apiOk(signUploadRequest(folder));
  } catch (error) {
    return apiFail(error);
  }
};
