"use client";

import { useCoupleInfoForm } from "@/client/hooks";
import { CoupleInfoFormView } from "@/client/components/organisms";
export function CoupleInfoForm() {
  const formState = useCoupleInfoForm({ type: "edit" });

  return <CoupleInfoFormView type="edit" {...formState} />;
}
