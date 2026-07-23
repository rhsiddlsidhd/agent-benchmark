"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProduct } from "@/server/actions";
import { APIResponse } from "@/shared/types";
import { PremiumFeature } from "@/server/services";
import { ProductRegistrationForm as PureProductRegistrationForm } from "@/client/components/organisms";
export function ProductRegistrationForm({
  premiumFeatures,
}: {
  premiumFeatures: PremiumFeature[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<
    APIResponse<{ message: string }>,
    FormData
  >(createProduct, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.data.message);
      router.push("/admin/products");
    }
  }, [state, router]);

  return (
    <PureProductRegistrationForm
      premiumFeatures={premiumFeatures}
      action={action}
      pending={pending}
      state={state}
      onCancel={() => router.push("/admin/products")}
    />
  );
}
