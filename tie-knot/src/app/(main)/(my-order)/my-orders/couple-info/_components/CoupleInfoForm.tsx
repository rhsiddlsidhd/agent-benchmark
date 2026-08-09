"use client";

import { useCoupleInfoForm } from "@/client/hooks";
import { CoupleInfoFormView } from "@/client/components/organisms";
export function CoupleInfoForm() {
  const formState = useCoupleInfoForm({ type: "create" });

  return <CoupleInfoFormView type="create" {...formState} />;
}
