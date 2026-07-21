"use client";

import { useCoupleInfoForm } from "@/hooks";
import { CoupleInfoFormView } from "@/components/organisms";
export function CoupleInfoForm() {
  const formState = useCoupleInfoForm({ type: "edit" });

  return <CoupleInfoFormView type="edit" {...formState} />;
}
