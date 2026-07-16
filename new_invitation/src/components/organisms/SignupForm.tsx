"use client";

import type React from "react";

import { useActionState, useEffect, useState } from "react";

import Link from "next/link";
import { Globe } from "lucide-react";

import { useRouter } from "next/navigation";
import { signupUser } from "@/actions/signupUser";

import { Checkbox } from "@/components/atoms/checkbox";
import { Button } from "@/components/atoms/button";
import { Label } from "@/components/atoms/label";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";
import TextField from "@/components/organisms/fields/TextField";
import { getFieldError, hasFieldErrors } from "@/utils/error";
import { toast } from "sonner";
import { APIResponse } from "@/types/error";

export function SignupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(signupUser, null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      alert(state.data.message);
      router.push("/login");
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, router]);

  const nameError = getFieldError(state, "name");
  const emailError = getFieldError(state, "email");
  const phoneError = getFieldError(state, "phone");
  const passwordError = getFieldError(state, "password");
  const confirmPasswordError = getFieldError(state, "confirmPassword");

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <TypographyH1 className="text-left text-3xl font-bold">회원가입</TypographyH1>
        <TypographyMuted>새 계정을 만들어 시작하세요</TypographyMuted>
      </div>

      <form action={action} className="space-y-4">
        <TextField id="name" name="name" type="text" placeholder="홍길동" required error={nameError}>
          이름
        </TextField>

        <TextField id="email" name="email" type="email" placeholder="your@email.com" required error={emailError}>
          이메일
        </TextField>

        <TextField id="phone" name="phone" type="tel" placeholder="010-1234-5678" required error={phoneError}>
          전화번호
        </TextField>

        <TextField id="password" name="password" type="password" placeholder="••••••••" required error={passwordError}>
          비밀번호
        </TextField>

        <TextField id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required error={confirmPasswordError}>
          비밀번호 확인
        </TextField>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) =>
                setAgreedToTerms(checked as boolean)
              }
            />
            <Label
              htmlFor="terms"
              className="cursor-pointer text-sm font-normal"
            >
              <Link href="#" className="text-primary hover:underline">
                이용약관
              </Link>
              에 동의합니다 (필수)
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="privacy"
              checked={agreedToPrivacy}
              onCheckedChange={(checked) =>
                setAgreedToPrivacy(checked as boolean)
              }
            />
            <Label
              htmlFor="privacy"
              className="cursor-pointer text-sm font-normal"
            >
              <Link href="#" className="text-primary hover:underline">
                개인정보 처리방침
              </Link>
              에 동의합니다 (필수)
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!agreedToPrivacy || !agreedToTerms || pending}
        >
          회원가입
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
        <Globe className="aspect-square w-4" />
        Google로 가입하기
      </Button>

      <div className="text-center">
        <TypographyMuted>
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            로그인
          </Link>
        </TypographyMuted>
      </div>
    </div>
  );
}
