"use client";

import { useCoupleInfoForm } from "@/hooks";
import { CoupleInfoFormView } from "@/components/organisms/CoupleInfoFormView";

export function CoupleInfoForm() {
  const formState = useCoupleInfoForm({ type: "edit" });

  return <CoupleInfoFormView type="edit" {...formState} />;
}
