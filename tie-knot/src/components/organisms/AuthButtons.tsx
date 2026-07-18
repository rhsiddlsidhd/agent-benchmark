"use client";

import { useAuth } from "@/hooks/useAuth";
import UserAccountNav from "./UserAccountNav";
import LoginEntryButton from "./LoginEntryButton";
import { Skeleton } from "@/components/atoms/skeleton";
import useAuthStore from "@/store/auth.store";

export function AuthButtons() {
  const { isLoading } = useAuth();
  const isAuth = useAuthStore((state) => state.isAuth);
  if (isLoading) return <Skeleton className="h-9 w-9 rounded-md" />;
  if (isAuth) return <UserAccountNav />;
  return <LoginEntryButton />;
}
