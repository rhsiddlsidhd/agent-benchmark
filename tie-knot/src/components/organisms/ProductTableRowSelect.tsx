"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { isStatus, STATUS_ITEMS } from "@/types/productTableRow";
import { updateProductStatusAction } from "@/actions/updateProductStatusAction";
import { toast } from "sonner";
import StatusSelect from "@/components/molecules/StatusSelect";
import { Product } from "@/services/product.service";

const ProductTableRowSelect = ({ product }: { product: Product }) => {
  const router = useRouter();
  const [status, setStatus] = useState<string>(product.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const handleStatusChange = async (newStatus: string) => {
    if (!isStatus(newStatus)) return;
    setIsUpdatingStatus(true);
    setStatus(newStatus);

    try {
      const result = await updateProductStatusAction(product._id, newStatus);

      if (result.success === false) {
        toast.error(result.error.message || "상태 변경에 실패했습니다.");
        setStatus(product.status);
        return;
      }

      router.refresh();
    } catch {
      toast.error("상태 변경 중 오류가 발생했습니다.");
      setStatus(product.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  return (
    <StatusSelect
      value={status}
      disabled={isUpdatingStatus}
      items={STATUS_ITEMS}
      onValueChange={(value) => {
        handleStatusChange(value);
      }}
      className={"w-27.5"}
    />
  );
};

export default ProductTableRowSelect;
