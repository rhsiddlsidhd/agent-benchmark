import useAuthStore from "@/store/auth.store";
import { ErrorResponse, SuccessResponse } from "./response";
import { HTTPError } from "@/types/error";
import { UserRole } from "@/models/user.model";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}> = [];
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export async function refreshAccessToken(): Promise<string> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) {
      throw new HTTPError("Session expired, please log in again.", res.status);
    }

    const {
      data,
    }: SuccessResponse<{
      accessToken: string;
      role: string;
      email: string;
      userId: string;
    }> = await res.json();
    const { accessToken, role, email, userId } = data;

    // role 유효성 검증
    const validRoles: UserRole[] = ["ADMIN", "USER"];
    if (!validRoles.includes(role as UserRole)) {
      throw new HTTPError("Invalid role received from server", 500);
    }

    // Zustand 스토어 업데이트
    useAuthStore.getState().setToken({
      token: accessToken,
      role: role as UserRole,
      email,
      userId,
    });

    return accessToken;
  } catch (error) {
    // 리프레시 실패 시, 사용자를 로그아웃 처리
    useAuthStore.getState().clearAuth();
    throw error;
  }
}

export async function fetcher<T>(
  url: string,
  config: { auth: boolean } = { auth: false },
  options?: RequestInit,
): Promise<T> {
  try {
    const token = useAuthStore.getState().token;
    const { auth = false } = config;

    const headers = new Headers(options?.headers);
    if (auth && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const finalOptions: RequestInit = {
      ...options,
      headers,
    };

    const res = await fetch(url, finalOptions);

    if (res.ok) {
      const body: SuccessResponse<T> = await res.json();

      return body.data;
    }

    // ===== 에러 응답 처리 =====
    const body: ErrorResponse = await res.json();
    const { message, code } = body.error;

    // ===== !401 처리 =====
    if (res.status !== 401) {
      throw new HTTPError(message, code);
    }

    // ===== 401 처리 (토큰 리프레시) =====
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);

        const retryHeaders = new Headers(headers);
        retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

        const retryRes = await fetch(url, {
          ...finalOptions,
          headers: retryHeaders,
        });

        if (!retryRes.ok) {
          const errorBody: ErrorResponse = await retryRes.json();
          throw new HTTPError(errorBody.error.message, errorBody.error.code);
        }

        const retryBody: SuccessResponse<T> = await retryRes.json();

        return retryBody.data;
      } catch (error) {
        processQueue(error, null);
        throw error;
      } finally {
        isRefreshing = false;
      }
    }

    // ===== 이미 refresh 중이면 큐에 대기 =====
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((newAccessToken) => {
        const retryHeaders = new Headers(headers);
        retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

        return fetch(url, {
          ...finalOptions,
          headers: retryHeaders,
        });
      })
      .then(async (res) => {
        if (!res.ok) {
          throw new HTTPError("Retry failed after refresh", res.status);
        }
        const body: SuccessResponse<T> = await res.json();

        return body.data;
      });
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new Error("An unexpected error occurred.");
  }
}
