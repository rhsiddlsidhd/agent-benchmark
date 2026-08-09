"use client";

import useSWR from "swr";
import { fetcher } from "@/client/fetcher";
import { BanksResponse } from "@/shared/schemas";

export function useBanks() {
  const { data, error, isLoading } = useSWR<BanksResponse>("/api/banks", fetcher);

  return {
    banks: data,
    isLoading,
    isError: error,
  };
}
