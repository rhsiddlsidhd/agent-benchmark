"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { requestPasswordReset } from "@/server/actions";
import { hasFieldErrors } from "@/shared/utils";
import { APIResponse } from "@/shared/types";
import { ForgotPasswordForm as PureForgotPasswordForm } from "@/client/components/organisms";
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

  return (
    <PureForgotPasswordForm action={action} pending={pending} state={state} />
  );
}
