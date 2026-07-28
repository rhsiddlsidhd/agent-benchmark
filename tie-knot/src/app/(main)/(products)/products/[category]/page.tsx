import { TypographyH1, TypographyMuted } from "@/client/components/atoms";
import { ProductCatalog } from "../_components";
import { getAllProductsService } from "@/server/services";
import { productCategoryLabels, isProductCategory } from "@/shared/utils";
import { notFound } from "next/navigation";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  // 세그먼트 값이 유효한 ProductCategory가 아니면 404
  if (!isProductCategory(category)) {
    notFound();
  }

  const products = await getAllProductsService(category);
  const currentCategoryLabel = productCategoryLabels[category];

  return (
    <main className="bg-background min-h-screen">
      {/* <Header /> */}
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <TypographyH1 className="mb-4 text-4xl font-bold text-balance md:text-5xl">
              {currentCategoryLabel}
            </TypographyH1>
            <TypographyMuted>
              당신의 스타일에 맞는 완벽한 {currentCategoryLabel} 상품을
              찾아보세요
            </TypographyMuted>
          </div>
          <ProductCatalog products={products} category={category} />
        </div>
      </div>
    </main>
  );
}
