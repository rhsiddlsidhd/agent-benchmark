"use client";

import { useTransition } from "react";
import { issueEntryToken } from "@/server/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * 특정 경로(nextPath)로 진입하기 전, 서버로부터 Entry 토큰을 발급받고 이동을 처리하는 훅
 * 보안이 필요한 모든 경로의 '관문' 역할을 수행합니다.
 * @param nextPath 최종적으로 진입하고자 하는 목적지 경로
 */
export const useEntry = (nextPath: string) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleEntry = () => {
    startTransition(async () => {
      const result = await issueEntryToken(nextPath);

      if (result.success === false) {
        toast.error(result.error.message);
        return;
      }

      router.push(result.data.path);
    });
  };

  return { handleEntry };
};
