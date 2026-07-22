"use client";

import { useAuth } from "@/hooks";
import { UserAccountNav } from "./UserAccountNav";
import { LoginEntryButton } from "@/components/organisms";
import { Skeleton } from "@/components/atoms";
import { useAuthStore } from "@/store";
export function AuthButtons() {
  const { isLoading } = useAuth();
  const isAuth = useAuthStore((state) => state.isAuth);
  if (isLoading) return <Skeleton className="h-9 w-9 rounded-md" />;
  if (isAuth) return <UserAccountNav />;
  return <LoginEntryButton />;
}
