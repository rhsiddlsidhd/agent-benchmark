"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createProduct } from "@/actions";
import { APIResponse } from "@/types";
import { PremiumFeature } from "@/services";
import { ProductRegistrationForm as PureProductRegistrationForm } from "@/components/organisms";
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
