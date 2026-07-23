"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useAuthStore } from "@/store";
import { AuthSessionResponse } from "@/schemas";
import { fetcher } from "@/api";
export function useAuth() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const { data: session, isLoading } = useSWR<AuthSessionResponse>(
    "/api/auth/me",
    (url) => fetcher<AuthSessionResponse>(url),
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
