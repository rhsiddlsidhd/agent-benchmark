"use client";

import useSWR from "swr";
import { AuthSessionResponse } from "@/shared/schemas";
import { fetcher } from "@/client/fetcher";
export function useAuth() {
  const { data: session, isLoading } = useSWR<AuthSessionResponse>(
    "/api/auth/me",
    fetcher,
    { revalidateOnFocus: false },
  );

  return { session: session ?? null, isLoading };
}
