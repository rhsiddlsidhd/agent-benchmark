"use client";
import { deleteProductAction } from "@/actions/deleteProductAction";
import { ProductTableRowProps } from "@/app/(main)/(admin)/admin/products/_components/ProductTableRow";
import { Button } from "@/components/atoms/button";
import { useAdminModalStore } from "@/store/admin.modal.store";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const ProductTableRowAction = ({ product }: ProductTableRowProps) => {
  const open = useAdminModalStore((state) => state.openModal);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${product.title}" 상품을 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteProductAction(product._id);

      if (result.success === false) {
        toast.error(result.error.message || "삭제에 실패했습니다.");
        return;
      }

      toast.success(result.data.message);
      router.refresh();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => open("EDIT-PRODUCT", { product })}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ProductTableRowAction;
