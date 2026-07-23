"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createGuestbook } from "@/server/actions";
import { APIResponse } from "@/shared/types";
import { hasFieldErrors } from "@/shared/utils";
import { useGuestbookModalStore } from "@/client/store";
import { CreateGuestbookForm as PureCreateGuestbookForm } from "@/client/components/organisms";
interface Payload {
  id: string;
}

const isPayload = (payload: unknown): payload is Payload => {
  if (!payload) return false;
  if (
    typeof payload === "object" &&
    "id" in payload &&
    typeof payload.id === "string"
  )
    return true;
  return false;
};

export function CreateGuestbookForm({ payload }: { payload: unknown }) {
  const closeModal = useGuestbookModalStore((state) => state.closeModal);
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(createGuestbook, null);
  const router = useRouter();
  const id = isPayload(payload) ? payload.id : null;
  if (!id) throw new Error("CreateGuestbookForm payload is required");

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast.message(state.data.message);
      closeModal();
      return router.refresh();
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, router, closeModal]);

  return (
    <PureCreateGuestbookForm
      coupleInfoId={id}
      action={action}
      pending={pending}
      state={state}
    />
  );
}
