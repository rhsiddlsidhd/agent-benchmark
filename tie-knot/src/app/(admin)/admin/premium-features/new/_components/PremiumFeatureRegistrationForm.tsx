"use client";

import { useActionState, useEffect } from "react";

import { createPremiumFeature } from "@/server/actions";
import { APIResponse } from "@/shared/types";
import { PremiumFeatureRegistrationForm as PurePremiumFeatureRegistrationForm } from "@/client/components/organisms";
export function PremiumFeatureRegistrationForm() {
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(createPremiumFeature, null);

  useEffect(() => {
    if (state && state.success && state.data) alert(state.data.message);
  }, [state]);

  return (
    <PurePremiumFeatureRegistrationForm
      action={action}
      pending={pending}
      state={state}
    />
  );
}
