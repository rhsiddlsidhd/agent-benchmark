"use client";

import {
  initialFilterState,
  ProductFilterProvider,
  useProductFilter,
} from "@/client/context/productFilter";
import React from "react";
import { ProductFilters, ProductGrid } from "@/client/components/organisms";
import { Product, PremiumFeature } from "@/server/services";

import { ProductCategory, SubCategory } from "@/shared/utils";

interface ProductCatalogProps {
  products: Product[];
  category: ProductCategory;
  premiumFeatures: PremiumFeature[];
  initialSubCategory: SubCategory | "all";
}

function ProductCatalogBody({
  products,
  category,
  premiumFeatures,
}: Omit<ProductCatalogProps, "initialSubCategory">) {
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
  initialSubCategory,
}: ProductCatalogProps) => {
  return (
    <ProductFilterProvider
      initialValue={{ ...initialFilterState, subCategory: initialSubCategory }}
    >
      <ProductCatalogBody
        products={products}
        category={category}
        premiumFeatures={premiumFeatures}
      />
    </ProductFilterProvider>
  );
};

export { ProductCatalog };
