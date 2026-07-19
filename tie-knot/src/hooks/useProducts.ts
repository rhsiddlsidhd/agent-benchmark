"use client";

import useSWR from "swr";
import { fetcher } from "@/api/fetcher";
import { Product } from "@/services/product.service";
import { ProductCategory } from "@/utils";

export function useProducts(
  category: ProductCategory,
  fallbackData: Product[],
): Product[] {
  const { data } = useSWR<Product[]>(
    `/api/products?category=${category}`,
    fetcher,
    {
      fallbackData,
      revalidateOnMount: false,
      revalidateIfStale: false,
    },
  );

  return data ?? fallbackData;
}
