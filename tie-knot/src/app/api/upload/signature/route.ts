import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCookie } from "@/lib/cookies/get";
import { decrypt } from "@/lib/token";

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const cookie = await getCookie("token");

    if (!cookie?.value) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 },
      );
    }

    const { payload } = await decrypt({ token: cookie.value, type: "REFRESH" });

    if (!payload.id) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 },
      );
    }

    // 2. 요청 파싱
    const { folder } = await request.json();

    if (!folder) {
      return NextResponse.json(
        { error: "folder 파라미터가 필요합니다" },
        { status: 400 },
      );
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
    return NextResponse.json({
      signature,
      ...paramsToSign,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
    });
  } catch (error) {
    console.error("Signature generation error:", error);
    return NextResponse.json(
      { error: "서명 생성에 실패했습니다" },
      { status: 500 },
    );
  }
}
