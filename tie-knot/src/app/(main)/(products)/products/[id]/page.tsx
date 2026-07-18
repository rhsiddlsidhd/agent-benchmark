export const revalidate = 3600;

import { ProductFeatures } from "@/components/organisms/ProductFeatures";
import { ProductSummary } from "@/components/organisms/ProductSummary";
import { getPremiumFeatureService } from "@/services/premiumFeature.service";
import { getAllProductsService, getProductService } from "@/services/product.service";
import { notFound } from "next/navigation";
import React from "react";

export async function generateStaticParams() {
  const products = await getAllProductsService();
  return products.map((p) => ({ id: p._id.toString() }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await getProductService(id);

  if (!product) notFound();
  const options = await getPremiumFeatureService(product.featureIds);

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-4xl">
          <ProductSummary product={product} options={options} />
          <ProductFeatures options={options} />
        </div>
      </div>
    </main>
  );
}
