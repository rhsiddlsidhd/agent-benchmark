import { encrypt } from "@/server/lib/jose";
import { type NextRequest } from "next/server";
import { setCookie, deleteCookie } from "@/server/lib/cookies";
import { HTTPError } from "@/shared/types";
import { APIRouteResponse, apiOk, apiFail } from "@/server/response";
// entry 토큰을 발행하고 지정된 경로로 401 리다이렉트

export const POST = async (
  req: NextRequest,
): Promise<APIRouteResponse<{ path: string }>> => {
  try {
    const path = req.nextUrl.searchParams.get("next");
    if (!path) throw new HTTPError("잘못된 요청입니다.", 401);

    const entryToken = await encrypt({ type: "ENTRY" });
    await deleteCookie("token");
    await setCookie({ name: "entry", value: entryToken, maxAge: 600 });

    return apiOk({ path });
  } catch (e) {
    console.error("entry token issue", e);
    return apiFail(e);
  }
};
