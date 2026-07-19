import { ErrorResponse, SuccessResponse } from "./response";
import { HTTPError } from "@/types";

// useSWR 없이 직접 호출하는 mutation 요청 전용(POST/DELETE/PATCH 등).
// 인증 쿠키는 동일 origin이라 브라우저가 자동으로 실어준다.
export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);

  if (res.ok) {
    const body: SuccessResponse<T> = await res.json();
    return body.data;
  }

  const body: ErrorResponse = await res.json();
  throw new HTTPError(body.error.message, body.error.code);
}
