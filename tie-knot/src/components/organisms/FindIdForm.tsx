"use client";

import { useActionState, useEffect } from "react";

import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { findUserEmail } from "@/actions/findUserEmail";
import { Card } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { TypographyH1, TypographyLarge, TypographyMuted } from "@/components/atoms/typoqraphy";
import TextField from "@/components/organisms/fields/TextField";
import { getFieldError, hasFieldErrors } from "@/utils/error";
import { APIResponse } from "@/types/error";

export function FindIdForm() {
  const [state, action, pending] = useActionState<
    APIResponse<{ email: string }>,
    FormData
  >(findUserEmail, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === false) {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state]);

  const nameError = getFieldError(state, "name");
  const phoneError = getFieldError(state, "phone");

  if (state && state.success) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <TypographyH1 className="text-3xl font-bold">
            아이디 찾기 완료
          </TypographyH1>
          <TypographyMuted>
            입력하신 정보와 일치하는 아이디입니다
          </TypographyMuted>
        </div>

        <Card className="bg-muted/50 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-3">
              <Mail className="text-primary h-6 w-6" />
            </div>
            <div>
              <TypographyMuted className="mb-1">
                회원님의 이메일
              </TypographyMuted>
              <TypographyLarge className="font-semibold">{state.data.email}</TypographyLarge>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/login">로그인하기</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full bg-transparent"
            size="lg"
          >
            <Link href="/find-pw">비밀번호 찾기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <TypographyH1 className="text-left text-3xl font-bold">아이디 찾기</TypographyH1>
        <TypographyMuted>
          가입 시 등록한 정보를 입력해주세요
        </TypographyMuted>
      </div>

      <form action={action} className="space-y-4">
        <TextField id="name" name="name" type="text" placeholder="홍길동" required error={nameError}>
          이름
        </TextField>

        <TextField id="phone" name="phone" type="tel" placeholder="010-1234-5678" required error={phoneError}>
          전화번호
        </TextField>

        <Button type="submit" className="w-full" size="lg">
          아이디 찾기 {pending ? "중" : ""}
        </Button>
      </form>

      <div className="space-y-2 text-center">
        <TypographyMuted>
          비밀번호가 기억나지 않으신가요?
          <Link
            href="/find-pw"
            className="text-primary font-medium hover:underline"
          >
            비밀번호 찾기
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
