"use client";

import useSWR from "swr";
import { fetcher } from "@/api";
import { SubwayStationsResponse } from "@/schemas";

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
