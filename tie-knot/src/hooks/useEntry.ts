"use client";

import { handleClientError } from "@/api/error";
import { fetcher } from "@/api/fetcher";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * 특정 경로(nextPath)로 진입하기 전, 서버로부터 Entry 토큰을 발급받고 이동을 처리하는 훅
 * 보안이 필요한 모든 경로의 '관문' 역할을 수행합니다.
 * @param nextPath 최종적으로 진입하고자 하는 목적지 경로
 */
export const useEntry = (nextPath: string) => {
  const router = useRouter();

  const handleEntry = async () => {
    try {
      // Entry 토큰 발급 및 진입점 유효성 확인
      await fetcher<{ path: string }>(
        `/api/auth/entry?next=${encodeURIComponent(nextPath)}`,
        undefined,
        {
          method: "POST",
        },
      );
      
      // 토큰 발급 성공 시 목적지로 이동
      router.push(nextPath);
    } catch (e) {
      const result = handleClientError(e);
      if (result && "message" in result) {
        toast.error(result.message);
      }
    }
  };

  return { handleEntry };
};
