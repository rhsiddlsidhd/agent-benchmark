"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { PremiumFeature } from "@/server/services";
import { updatePremiumFeature } from "@/server/actions";
import { APIResponse } from "@/shared/types";
import { hasFieldErrors } from "@/shared/utils";
import { PremiumFeatureDialog as PurePremiumFeatureDialog } from "@/client/components/organisms";
export function PremiumFeatureDialog({
  premiumFeature,
}: {
  premiumFeature: PremiumFeature;
}) {
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(updatePremiumFeature, null);

  useEffect(() => {
    if (!state) return;
    if (state.success === true) {
      toast.success(state.data.message);
    } else {
      if (!hasFieldErrors(state.error)) {
        toast.error(state.error.message);
      }
    }
  }, [state]);

  return (
    <PurePremiumFeatureDialog
      premiumFeature={premiumFeature}
      action={action}
      pending={pending}
      state={state}
    />
  );
}
