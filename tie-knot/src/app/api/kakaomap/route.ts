import { APIRouteResponse, apiOk, apiFail } from "@/api";
import { HTTPError } from "@/types";
import { NextRequest } from "next/server";

export const GET = async (req: NextRequest): Promise<APIRouteResponse<unknown>> => {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");
    const REST_API_KEY = process.env.KAKAO_REST_API_KEY;

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address?query=${address}`,
      {
        headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
      },
    );

    const data = await response.json();

    if (!response.ok || data.errorType) {
      throw new HTTPError(
        data.message ?? "주소 검색에 실패했습니다.",
        response.status || 500,
      );
    }

    return apiOk(data);
  } catch (error) {
    return apiFail(error);
  }
};
