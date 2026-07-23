"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { updateUserPassword } from "@/server/actions";
import { apiRequest } from "@/client/apiRequest";
import { hasFieldErrors } from "@/shared/utils";
import { APIResponse } from "@/shared/types";
import { UpdatePasswordForm as PureUpdatePasswordForm } from "@/client/components/organisms";
const deleteCookieToUserEmail = async (): Promise<void> => {
  try {
    await apiRequest<void>("/api/auth/cookie", { method: "DELETE" });
  } catch (error) {
    console.debug("Cookie deletion failed during cleanup:", error);
  }
};

export function UpdatePasswordForm() {
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

  return (
    <PureUpdatePasswordForm
      action={action}
      pending={pending}
      state={state}
      token={token}
    />
  );
}
