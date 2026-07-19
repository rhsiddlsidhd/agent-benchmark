"use client";

import { useProducts, usePremiumFeature } from "@/hooks";
import ProductCatalogView from "@/components/organisms/ProductCatalog";
import { Product } from "@/services/product.service";
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
