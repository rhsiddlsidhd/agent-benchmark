import { ErrorResponse, SuccessResponse, HTTPError } from "@/shared/types";

// useSWR 전용 — (url: string) => Promise<T>. 인증 쿠키는 동일 origin이라 브라우저가 자동으로 실어준다.
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (res.ok) {
    const body: SuccessResponse<T> = await res.json();
    return body.data;
  }

  const body: ErrorResponse = await res.json();
  throw new HTTPError(body.error.message, body.error.code);
}
