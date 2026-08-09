export const revalidate = 3600;

import { ProductDetailTemplate } from "./_components";
import { getPremiumFeatureService, getAllProductsService, getProductService } from "@/server/services";

import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const products = await getAllProductsService();
  return products.map((p) => ({ category: p.category, id: p._id.toString() }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { id } = await params;

  const product = await getProductService(id);

  if (!product) notFound();
  const options = await getPremiumFeatureService(product.featureIds);

  return <ProductDetailTemplate product={product} options={options} />;
}
