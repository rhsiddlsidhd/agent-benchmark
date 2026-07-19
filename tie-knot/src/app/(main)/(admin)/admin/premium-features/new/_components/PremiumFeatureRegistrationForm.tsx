"use client";

import { useActionState, useEffect } from "react";

import { createPremiumFeature } from "@/actions/createPremiumFeature";
import { APIResponse } from "@/types";
import { PremiumFeatureRegistrationForm as PurePremiumFeatureRegistrationForm } from "@/components/organisms/PremiumFeatureRegistrationForm";

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
