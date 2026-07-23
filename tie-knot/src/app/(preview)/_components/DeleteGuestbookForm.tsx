"use client";

import { useActionState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { deleteGuestbook } from "@/server/actions";
import { APIResponse } from "@/shared/types";
import { hasFieldErrors } from "@/shared/utils";
import { useGuestbookModalStore } from "@/client/store";
import { DeleteGuestbookForm as PureDeleteGuestbookForm } from "@/client/components/organisms";
export function DeleteGuestbookForm({ payload }: { payload: string }) {
  const params = useParams();
  const query = useSearchParams();
  const closeModal = useGuestbookModalStore((state) => state.closeModal);
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(deleteGuestbook, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast(state.data.message);
      closeModal();
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state, closeModal]);

  return (
    <PureDeleteGuestbookForm
      guestbookId={payload}
      coupleInfoId={params.id}
      productId={query.get("product")}
      action={action}
      pending={pending}
      state={state}
    />
  );
}
