"use client";

import useSWR from "swr";
import { fetcher } from "@/client/fetcher";
import { SubwayStationsResponse } from "@/shared/schemas";

export function useSubwayStations() {
  const { data, error, isLoading } = useSWR<SubwayStationsResponse>(
    "/api/subway",
    fetcher,
  );

  return {
    subwayStations: data,
    isLoading,
    isError: error,
  };
}
