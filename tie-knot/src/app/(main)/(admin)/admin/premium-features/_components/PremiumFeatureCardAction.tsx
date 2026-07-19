"use client";
import React from "react";

import { Button } from "@/components/atoms/button";
import { Edit, Trash2 } from "lucide-react";
import { PremiumFeature } from "@/services/premiumFeature.service";
import { useAdminModalStore } from "@/store/admin.modal.store";

const PremiumFeatureCardAction = ({
  premiumFeature,
}: {
  premiumFeature: PremiumFeature;
}) => {
  const openModal = useAdminModalStore((state) => state.openModal);

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => openModal("EDIT-PREMIUMFEATURE", { premiumFeature })}
      >
        <Edit className="mr-1 h-4 w-4" />
        수정
      </Button>
      <Button size="sm" variant="outline">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PremiumFeatureCardAction;
