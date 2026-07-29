"use client";

import {
  initialFilterState,
  ProductFilterProvider,
  useProductFilter,
} from "@/client/context/productFilter";
import React from "react";
import { ProductFilters, ProductGrid } from "@/client/components/organisms";
import { Product, PremiumFeature } from "@/server/services";

import { ProductCategory } from "@/shared/utils";

interface ProductCatalogProps {
  products: Product[];
  category: ProductCategory;
  premiumFeatures: PremiumFeature[];
}

function ProductCatalogBody({
  products,
  category,
  premiumFeatures,
}: ProductCatalogProps) {
  const [state, dispatch] = useProductFilter();

  return (
    <>
      {/* Filters */}
      <ProductFilters
        data={products}
        category={category}
        premiumFeatures={premiumFeatures}
        state={state}
        dispatch={dispatch}
      />
      {/* Product Grid */}
      <ProductGrid data={products} state={state} />
    </>
  );
}

const ProductCatalog = ({
  products,
  category,
  premiumFeatures,
}: ProductCatalogProps) => {
  return (
    <ProductFilterProvider initialValue={initialFilterState}>
      <ProductCatalogBody
        products={products}
        category={category}
        premiumFeatures={premiumFeatures}
      />
    </ProductFilterProvider>
  );
};

export { ProductCatalog };
