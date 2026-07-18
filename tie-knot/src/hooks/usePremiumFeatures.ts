"use client";
/**
 * 추후 서버 캐싱으로 변환
 *  - 현재는 Clint Hook 에서 API를 직접 호출
 *  - 이 데이터는 자주 변하지 않음
 *  - 따라서 서버 캐시 라이브러리를 통해서 불필요한 네트워크 요청을 줄이고 보다 빠른 데이터를 제공한다.
 */
import { handleClientError } from "@/api/error";
import { fetcher } from "@/api/fetcher";
import { PremiumFeature } from "@/services/premiumFeature.service";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const usePremiumFeature = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeature[]>([]);

  useEffect(() => {
    let flag = false;
    const getPremiumFeatures = async () => {
      setLoading(true);
      try {
        // API 응답 구조: { data: PremiumFeature[] }

        const data = await fetcher<{ features: PremiumFeature[] }>(
          "/api/premium-features",
        );

        if (flag) return;
        setPremiumFeatures(data.features ?? []);
      } catch (error) {
        if (flag) return;
        const result = handleClientError(error);
        if (result && "message" in result) {
          toast.error(result.message);
        }
        setPremiumFeatures([]);
      } finally {
        if (flag) return;
        setLoading(false);
      }
    };
    getPremiumFeatures();
    return () => {
      flag = true;
    };
  }, []);

  return { premiumFeatures, loading };
};

export default usePremiumFeature;
