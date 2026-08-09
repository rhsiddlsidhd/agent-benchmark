"use client";

import { useEffect, useTransition } from "react";
import { incrementProductViews } from "@/server/actions";

interface ProductViewTrackerProps {
  productId: string;
}

const ProductViewTracker = ({ productId }: ProductViewTrackerProps): null => {
  const [, startTransition] = useTransition();

  useEffect(() => {
    const trackView = async (): Promise<void> => {
      await incrementProductViews(productId);
    };
    startTransition(() => {
      trackView();
    });
  }, [productId, startTransition]);

  return null;
};

export { ProductViewTracker };
