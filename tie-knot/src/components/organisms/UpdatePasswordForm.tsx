import { Button, TypographyH1, TypographyMuted } from "@/components/atoms";

import { TextField } from "@/components/molecules";
import Link from "next/link";
import { getFieldError } from "@/utils";
import { APIResponse } from "@/types";

interface UpdatePasswordFormProps {
  action: (formData: FormData) => void;
  pending: boolean;
  state: APIResponse<{ message: string }> | null;
  token: string;
}

export function UpdatePasswordForm({
  action,
  pending,
  state,
  token,
}: UpdatePasswordFormProps) {
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
}
