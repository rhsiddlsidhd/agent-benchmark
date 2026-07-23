"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signupUser } from "@/server/actions";
import { hasFieldErrors } from "@/shared/utils";
import { APIResponse } from "@/shared/types";
import { SignupForm as PureSignupForm } from "@/client/components/organisms";
export function SignupForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(signupUser, null);

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

  return <PureSignupForm action={action} pending={pending} state={state} />;
}
