"use client";

import { initialFilterState, ProductFilterProvider } from "@/client/context/productFilter";
import React from "react";
import { ProductFilters } from "@/client/components/organisms/ProductFilters";
import { ProductGrid } from "@/client/components/organisms/ProductGrid";
import { Product, PremiumFeature } from "@/server/services";

import { ProductCategory } from "@/shared/utils";

interface ProductCatalogProps {
  products: Product[];
  category: ProductCategory;
  premiumFeatures: PremiumFeature[];
}

const ProductCatalog = ({
  products,
  category,
  premiumFeatures,
}: ProductCatalogProps) => {
  return (
    <ProductFilterProvider initialValue={initialFilterState}>
      {/* Filters */}
      <ProductFilters
        data={products}
        category={category}
        premiumFeatures={premiumFeatures}
      />
      {/* Product Grid */}
      <ProductGrid data={products} />
    </ProductFilterProvider>
  );
};

export { ProductCatalog };
