"use client";

import { useCoupleInfoForm } from "@/hooks";
import { CoupleInfoFormView } from "@/components/organisms";
export function CoupleInfoForm() {
  const formState = useCoupleInfoForm({ type: "create" });

  return <CoupleInfoFormView type="create" {...formState} />;
}
