"use client";

import useSWR from "swr";
import { fetcher } from "@/api/fetcher";
import { Banks } from "@/app/api/banks/route";

export function useBanks() {
  const { data, error, isLoading } = useSWR<Banks>("/api/banks", fetcher);

  return {
    banks: data,
    isLoading,
    isError: error,
  };
}
