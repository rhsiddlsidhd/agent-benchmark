"use client";

import useSWR from "swr";
import { fetcher } from "@/client/fetcher";
import { PremiumFeature } from "@/server/services";
import { useEffect } from "react";
import { toast } from "sonner";

const usePremiumFeature = () => {
  const { data, error, isLoading } = useSWR<{ features: PremiumFeature[] }>(
    "/api/premium-features",
    fetcher,
  );

  useEffect(() => {
    if (!error) return;
    toast.error(error.message);
  }, [error]);

  return { premiumFeatures: data?.features ?? [], loading: isLoading };
};

export { usePremiumFeature };
