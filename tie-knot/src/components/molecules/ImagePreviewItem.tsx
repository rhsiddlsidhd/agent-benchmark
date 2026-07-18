import { X } from "lucide-react";
import React from "react";
import ProductThumbnail from "@/components/molecules/ProductThumbnail";
import { Button } from "@/components/atoms/button";

interface ImagePreviewItemProps {
  id: string;
  preview: string;
  onRemove: (id: string) => void;
  sizes?: string;
}

/**
 * 삭제 버튼이 있는 이미지 미리보기 아이템 (Molecule)
 */
export const ImagePreviewItem = ({
  id,
  preview,
  onRemove,
  sizes,
}: ImagePreviewItemProps) => {
  return (
    <div className="border-border group relative aspect-square overflow-hidden rounded-lg border">
      <ProductThumbnail src={preview} alt={`Preview ${id}`} sizes={sizes} />
      <Button
        type="button"
        variant="ghost"
        onClick={() => onRemove(id)}
        className="bg-background/90 hover:bg-background absolute top-2 right-2 h-auto rounded-full p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
