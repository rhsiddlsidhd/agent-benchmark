"use client";

import useSWR from "swr";
import { fetcher } from "@/api";
import { handleClientError } from "@/utils";
import { PremiumFeature } from "@/services";
import { useEffect } from "react";
import { toast } from "sonner";

const usePremiumFeature = () => {
  const { data, error, isLoading } = useSWR<{ features: PremiumFeature[] }>(
    "/api/premium-features",
    fetcher,
  );

  useEffect(() => {
    if (!error) return;
    const result = handleClientError(error);
    if (result && "message" in result) {
      toast.error(result.message);
    }
  }, [error]);

  return { premiumFeatures: data?.features ?? [], loading: isLoading };
};

export { usePremiumFeature };
