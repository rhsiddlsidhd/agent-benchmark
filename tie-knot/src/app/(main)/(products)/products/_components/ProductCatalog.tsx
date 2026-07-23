"use client";

import { useProducts, usePremiumFeature } from "@/client/hooks";
import { ProductCatalog as ProductCatalogView } from "@/client/components/organisms";
import { Product } from "@/server/services";
import { ProductCategory } from "@/shared/utils";

export function ProductCatalog({
  products,
  category,
}: {
  products: Product[];
  category: ProductCategory;
}) {
  const data = useProducts(category, products);
  const { premiumFeatures } = usePremiumFeature();

  return (
    <ProductCatalogView
      products={data}
      category={category}
      premiumFeatures={premiumFeatures}
    />
  );
}
