"use client";

import {
  initialFilterState,
  ProductFilterProvider,
} from "@/context/productFilter/reducer";
import React from "react";
import { ProductFilters } from "@/components/organisms/ProductFilters";
import { ProductGrid } from "@/components/organisms/ProductGrid";
import { Product } from "@/services/product.service";
import { PremiumFeature } from "@/services/premiumFeature.service";
import { ProductCategory } from "@/utils";

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

export default ProductCatalog;
