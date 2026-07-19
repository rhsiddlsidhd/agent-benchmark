"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signupUser } from "@/actions/signupUser";
import { hasFieldErrors } from "@/utils";
import { APIResponse } from "@/types";
import { SignupForm as PureSignupForm } from "@/components/organisms/SignupForm";

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
