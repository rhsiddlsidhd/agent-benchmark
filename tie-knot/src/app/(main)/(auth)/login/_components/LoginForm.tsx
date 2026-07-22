"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/store";
import { loginUser } from "@/actions";
import { APIResponse } from "@/types";
import { UserRole } from "@/models";
import { getFieldError, hasFieldErrors } from "@/utils";
import { LoginForm as PureLoginForm } from "@/components/organisms";
export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ role: UserRole; email: string; userId: string }>,
    FormData
  >(loginUser, null);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      setSession({
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
  }, [state, setSession, router]);

  const emailError = getFieldError(state, "email");
  const passwordError = getFieldError(state, "password");

  return (
    <PureLoginForm
      action={action}
      pending={pending}
      emailError={emailError}
      passwordError={passwordError}
    />
  );
}
