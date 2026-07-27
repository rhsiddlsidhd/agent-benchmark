"use client";

import Link from "next/link";
import React from "react";
import { mutate } from "swr";
import { useAuth } from "@/client/hooks";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/client/components/atoms";

import { UserIcon, LogOut } from "lucide-react";
import { USER_NAV_ITEMS, routes } from "@/shared/constants";
import { logoutUser } from "@/server/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const UserAccountNav = () => {
  const { session } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutUser();

      mutate("/api/auth/me", null, false);
      toast.success("로그아웃되었습니다.");

      router.push(routes.home);
      router.refresh();
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("로그아웃 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {USER_NAV_ITEMS
          .filter((item) => (item.adminOnly ? session?.role === "ADMIN" : true))
          .map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href} className="flex w-full items-center">
                <item.icon className="mr-2 size-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive flex w-full items-center cursor-pointer"
        >
          <LogOut className="mr-2 size-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserAccountNav };
