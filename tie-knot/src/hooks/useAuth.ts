"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useAuthStore } from "@/store";
import { AuthSession } from "@/types";
import { fetcher } from "@/api";
export function useAuth() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { data: session, isLoading } = useSWR<AuthSession | null>(
    "/api/auth/me",
    (url) => fetcher<AuthSession | null>(url),
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (session) {
      setSession(session);
    } else if (session === null) {
      clearAuth();
    }
  }, [session, setSession, clearAuth]);

  return { isLoading };
}
