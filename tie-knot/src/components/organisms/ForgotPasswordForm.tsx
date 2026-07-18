"use client";

import type React from "react";
import { useActionState, useEffect } from "react";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import TextField from "@/components/organisms/fields/TextField";
import { TypographyH1, TypographyLarge, TypographyMuted, TypographySmall } from "@/components/atoms/typoqraphy";

import { requestPasswordReset } from "@/actions/requestPasswordReset";
import { getFieldError, hasFieldErrors } from "@/utils/error";
import { APIResponse } from "@/types/error";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string; email: string }>,
    FormData
  >(requestPasswordReset, null);

  useEffect(() => {
    if (!state || state.success === true) return;

    if (!hasFieldErrors(state.error)) {
      toast.error(state.error.message);
    }
  }, [state]);

  const emailError = getFieldError(state, "email");

  if (state && state.success === true) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-primary/10 rounded-full p-4">
              <CheckCircle2 className="text-primary h-12 w-12" />
            </div>
          </div>
          <TypographyH1 className="text-3xl font-bold">
            이메일을 확인하세요
          </TypographyH1>
          <TypographyMuted>
            비밀번호 재설정 링크를 보내드렸습니다
          </TypographyMuted>
        </div>

        <Card className="bg-muted/50 p-6">
          <div className="space-y-3 text-sm">
            <TypographySmall className="font-medium">
              다음 이메일로 재설정 링크가 전송되었습니다:
            </TypographySmall>
            <TypographyLarge className="text-primary font-semibold">{state.data.email}</TypographyLarge>
            <div className="text-muted-foreground space-y-2 pt-3">
              <TypographyMuted>• 이메일이 도착하지 않았다면 스팸함을 확인해주세요</TypographyMuted>
              <TypographyMuted>• 링크는 10분 동안 유효합니다</TypographyMuted>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">로그인으로 돌아가기</Link>
          </Button>
          <form action={action}>
            <input
              type="hidden"
              name="email"
              value={state.data.email}
              readOnly
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full bg-transparent"
              size="lg"
              disabled={pending}
            >
              {pending ? "전송 중..." : "다시 보내기"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <TypographyH1 className="text-left text-3xl font-bold">비밀번호 찾기</TypographyH1>
        <TypographyMuted>
          가입한 이메일 주소를 입력해주세요
        </TypographyMuted>
      </div>

      <form action={action} className="space-y-4">
        <TextField
          id="email"
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          error={emailError}
        >
          이메일
        </TextField>

        <TypographyMuted>
          입력하신 이메일로 비밀번호 재설정 링크를 보내드립니다
        </TypographyMuted>

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "전송 중..." : "재설정 링크 받기"}
        </Button>
      </form>

      <div className="space-y-2 text-center">
        <TypographyMuted>
          아이디가 기억나지 않으신가요?{" "}
          <Link
            href="/find-id"
            className="text-primary font-medium hover:underline"
          >
            아이디 찾기
          </Link>
        </TypographyMuted>
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-block text-sm transition-colors"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
