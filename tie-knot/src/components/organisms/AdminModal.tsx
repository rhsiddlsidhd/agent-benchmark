"use client";

import { ProductEditDialog } from "@/app/(main)/(admin)/admin/products/_components/ProductEditDialog";
import { AdminModalState, useAdminModalStore } from "@/store/admin.modal.store";
import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { PremiumFeatureDialog } from "./PremiumFeatureDialog";

const modalPayload: Record<
  Exclude<AdminModalState["type"], null>,
  {
    title: string;
    des: string;
    component: React.ComponentType<any>;
  }
> = {
  "EDIT-PRODUCT": {
    title: "상품 수정",
    des: "상품 정보를 수정합니다.",
    component: ProductEditDialog,
  },
  "EDIT-PREMIUMFEATURE": {
    title: "프리미엄 기능 수정",
    des: "프리미엄 기능 정보를 수정합니다.",
    component: PremiumFeatureDialog,
  },
};

const AdminModal = () => {
  const type = useAdminModalStore((state) => state.type);
  const open = useAdminModalStore((state) => state.isOpen);
  const close = useAdminModalStore((state) => state.closeModal);
  const props = useAdminModalStore((state) => state.props);

  if (!type) return null;

  const payload = modalPayload[type];
  const Component = payload.component;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{payload.title}</DialogTitle>
          <DialogDescription>{payload.des}</DialogDescription>
        </DialogHeader>
        {/* form */}
        <Component {...props} />
      </DialogContent>
    </Dialog>
  );
};

export default AdminModal;
