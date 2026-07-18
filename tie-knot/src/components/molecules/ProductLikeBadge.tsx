"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/atoms/badge";
import { cn } from "@/lib/utils";
import { fetcher } from "@/api/fetcher";
import { handleClientError } from "@/api/error";
import useAuthStore from "@/store/auth.store";

interface ProductLikeBadgeProps {
  productId: string;
  productLikes: string[];
  showCount?: boolean;
  className?: string;
}

const ProductLikeBadge = ({
  productId,
  productLikes,
  showCount = false,
  className,
}: ProductLikeBadgeProps) => {
  const userId = useAuthStore((state) => state.userId);
  const [localLikes, setLocalLikes] = useState<string[]>(productLikes);
  const isLiked = userId ? localLikes.includes(userId) : false;

  const updateProductLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      return;
    }

    const previousLikes = localLikes;

    // Optimistic update
    setLocalLikes((prev) =>
      isLiked ? prev.filter((id) => id !== userId) : [...prev, userId],
    );

    fetcher(
      `/api/products/${productId}/like`,
      { auth: true },
      { method: "POST" },
    )
      .then(() => {
        // Success
      })
      .catch((error) => {
        // Rollback on failure
        setLocalLikes(previousLikes);
        const result = handleClientError(error);
        if (result && "message" in result) {
          toast.error(result.message);
        }
      });
  };

  return (
    <Badge
      onClick={updateProductLike}
      variant="outline"
      className={cn(
        "cursor-pointer gap-1 bg-white/80 backdrop-blur-sm transition-colors hover:bg-white",
        showCount ? "px-2 py-1" : "aspect-square p-1.5",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isLiked ? "fill-red-500 text-red-500" : "text-slate-400"
        )}
      />
      {showCount && (
        <span className={cn("text-xs font-bold", isLiked ? "text-red-500" : "text-slate-600")}>
          {localLikes.length}
        </span>
      )}
    </Badge>
  );
};

export default ProductLikeBadge;
