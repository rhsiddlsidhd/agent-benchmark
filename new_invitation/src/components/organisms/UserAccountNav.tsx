"use client";

import Link from "next/link";
import React from "react";
import useAuthStore from "@/store/auth.store";

import { Button } from "@/components/atoms/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { UserIcon, LogOut } from "lucide-react";
import { USER_NAV_ITEMS } from "@/constants/navigation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const UserAccountNav = () => {
  const role = useAuthStore((state) => state.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  /**
   * 로그아웃 핸들러: API 호출 후 클라이언트 상태 초기화
   */
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("로그아웃 요청 실패");

      // 클라이언트 상태 초기화
      clearAuth();
      toast.success("로그아웃되었습니다.");
      
      // 메인 페이지로 이동 및 리프레시
      router.push("/");
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
          .filter((item) => (item.adminOnly ? role === "ADMIN" : true))
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

export default UserAccountNav;
