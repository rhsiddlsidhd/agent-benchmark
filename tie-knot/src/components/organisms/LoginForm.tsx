"use client";

import type React from "react";
import { useActionState, useEffect } from "react";

import Link from "next/link";
import { Globe } from "lucide-react";

import { useRouter } from "next/navigation";
import useAuthStore from "@/store/auth.store";

import { Button } from "@/components/atoms/button";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";

import { Checkbox } from "@/components/atoms/checkbox";
import { loginUser } from "@/actions/loginUser";
import { Label } from "@/components/atoms/label";
import { toast } from "sonner";
import { APIResponse } from "@/types/error";
import { UserRole } from "@/models/user.model";
import TextField from "@/components/organisms/fields/TextField";
import { getFieldError, hasFieldErrors } from "@/utils/error";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ token: string; role: UserRole; email: string; userId: string }>,
    FormData
  >(loginUser, null);
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      setToken({
        token: state.data.token,
        role: state.data.role,
        email: state.data.email,
        userId: state.data.userId,
      });
      return router.push("/");
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, setToken, router]);

  const emailError = getFieldError(state, "email");
  const passwordError = getFieldError(state, "password");

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <TypographyH1 className="text-left text-3xl font-bold">로그인</TypographyH1>
        <TypographyMuted className="text-sm">
          계정에 로그인하여 청첩장을 만들어보세요
        </TypographyMuted>
      </div>

      <form action={action} className="space-y-4">
        <TextField
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          required
          error={emailError}
        >
          이메일
        </TextField>

        <TextField
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          error={passwordError}
        >
          비밀번호
        </TextField>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" name="remember" />
            <Label
              htmlFor="remember"
              className="cursor-pointer text-sm font-normal"
            >
              로그인 상태 유지
            </Label>
          </div>

          <Link
            href="/find-pw"
            className="text-primary text-sm hover:underline"
          >
            비밀번호 찾기
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "로그인 중..." : "로그인"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background text-muted-foreground px-4">또는</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full bg-transparent"
        size="lg"
      >
        <Globe className="mr-2 h-5 w-5" />
        Google로 계속하기
      </Button>

      <div className="space-y-2 text-center">
        <TypographyMuted>
          아직 계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            회원가입
          </Link>
        </TypographyMuted>
        <Link
          href="/find-id"
          className="text-muted-foreground hover:text-foreground inline-block text-sm transition-colors"
        >
          아이디 찾기
        </Link>
      </div>
    </div>
  );
}
