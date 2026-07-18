import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";
import ProductCatalog from "@/components/organisms/ProductCatalog";
import { getAllProductsService } from "@/services/product.service";
import { productCategoryLabels, isProductCategory } from "@/utils/category";
import { notFound } from "next/navigation";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  // 엄격한 카테고리 검증: 없거나, "all"이거나, 유효한 ProductCategory가 아니면 404
  if (!category || category === "all" || !isProductCategory(category)) {
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
