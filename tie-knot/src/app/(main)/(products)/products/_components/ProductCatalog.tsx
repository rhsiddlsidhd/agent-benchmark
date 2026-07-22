"use client";

import { useProducts, usePremiumFeature } from "@/hooks";
import { ProductCatalog as ProductCatalogView } from "@/components/organisms";
import { Product } from "@/services";
import { ProductCategory } from "@/utils";

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
