"use client";

import { updateUserPassword } from "@/actions/updateUserPassword";
import { fetcher } from "@/api/fetcher";
import { Button } from "@/components/atoms/button";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";
import TextField from "@/components/organisms/fields/TextField";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useActionState, useEffect } from "react";
import { getFieldError, hasFieldErrors } from "@/utils/error";
import { APIResponse } from "@/types/error";
import { toast } from "sonner";

const deleteCookieToUserEmail = async (): Promise<void> => {
  try {
    await fetcher<void>("/api/auth/cookie", undefined, { method: "DELETE" });
  } catch (error) {
    console.debug("Cookie deletion failed during cleanup:", error);
    return null;
  }
};

const UpdatePasswordForm = () => {
  const router = useRouter();
  const token = useSearchParams().get("t") ?? "";
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(updateUserPassword, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast.message(state.data.message);
      return router.push("/login");
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
        router.push("/login");
      }
    }
  }, [state, router]);

  useEffect(() => {
    return () => {
      deleteCookieToUserEmail();
    };
  }, []);

  const passwordError = getFieldError(state, "password");
  const confirmPasswordError = getFieldError(state, "confirmPassword");

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <TypographyH1 className="text-left text-3xl font-bold">비밀번호 변경</TypographyH1>
        <TypographyMuted>변경할 비밀번호를 입력해주세요.</TypographyMuted>
      </div>

      <form action={action} className="space-y-4">
        <input name="token" defaultValue={token} hidden />

        <TextField id="password" name="password" type="password" placeholder="••••••••" required error={passwordError}>
          비밀번호
        </TextField>

        <TextField id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required error={confirmPasswordError}>
          비밀번호 확인
        </TextField>

        <Button type="submit" className="w-full" size="lg">
          비밀번호 변경 {pending ? "중" : "완료"}
        </Button>
      </form>

      <div className="space-y-2 text-center">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground inline-block text-sm transition-colors"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
};

export default UpdatePasswordForm;
