"use client";

import useSWR from "swr";
import { useEffect } from "react";
import useAuthStore from "@/store/auth.store";
import { AuthSession } from "@/types/auth";
import { fetcher } from "@/api/fetcher";

export function useAuth() {
  const setToken = useAuthStore((state) => state.setToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { data: session, isLoading } = useSWR<AuthSession | null>(
    "/api/auth/me",
    (url) => fetcher<AuthSession | null>(url),
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (session) {
      setToken(session);
    } else if (session === null) {
      clearAuth();
    }
  }, [session, setToken, clearAuth]);

  return { isLoading };
}
