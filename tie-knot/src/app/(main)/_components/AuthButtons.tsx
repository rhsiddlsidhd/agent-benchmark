"use client";

import { useAuth } from "@/client/hooks";
import { UserAccountNav } from "./UserAccountNav";
import { LoginEntryButton } from "@/client/components/organisms";
import { Skeleton } from "@/client/components/atoms";
import { useAuthStore } from "@/client/store";
export function AuthButtons() {
  const { isLoading } = useAuth();
  const isAuth = useAuthStore((state) => state.isAuth);
  if (isLoading) return <Skeleton className="h-9 w-9 rounded-md" />;
  if (isAuth) return <UserAccountNav />;
  return <LoginEntryButton />;
}
