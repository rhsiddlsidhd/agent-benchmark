import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { HTTPError } from "@/types";
import { getCookie } from "@/lib/cookies";
import { decrypt } from "@/lib/jose";

type UploadSignature = {
  signature: string;
  timestamp: number;
  folder: string;
  allowed_formats: string;
  cloudName: string | undefined;
  apiKey: string | undefined;
};

export const POST = async (
  request: NextRequest,
): Promise<APIRouteResponse<UploadSignature>> => {
  try {
    // 1. 인증 확인
    const cookie = await getCookie("token");

    if (!cookie?.value) {
      throw new HTTPError("로그인이 필요합니다.", 401);
    }

    const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });

    if (!payload.id) {
      throw new HTTPError("유효하지 않은 토큰입니다.", 401);
    }

    // 2. 요청 파싱
    const { folder } = await request.json();

    if (!folder) {
      throw new HTTPError("folder 파라미터가 필요합니다.", 400);
    }

    // 3. 타임스탬프 생성
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp,
      folder,
      allowed_formats: "jpg,png,webp,jpeg",
      // max_file_size: 10485760,
    };
    // 4. Cloudinary 서명 생성
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!,
    );

    // 5. 서명 정보 반환
    return apiOk({
      signature,
      ...paramsToSign,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    return apiFail(error);
  }
};
