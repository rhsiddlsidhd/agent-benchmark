"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { PremiumFeature } from "@/services/premiumFeature.service";
import { updatePremiumFeature } from "@/actions/updatePremiumFeature";
import { APIResponse } from "@/types";
import { hasFieldErrors } from "@/utils";
import { PremiumFeatureDialog as PurePremiumFeatureDialog } from "@/components/organisms/PremiumFeatureDialog";

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
