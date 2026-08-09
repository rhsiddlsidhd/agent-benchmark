import { TypographyH1, TypographyMuted } from "@/client/components/atoms";
import { ProductCatalog } from "../_components";
import { getAllProductsService } from "@/server/services";
import { isProductCategory, isSubCategory } from "@/shared/utils";
import { productCategoryLabels, SubCategory } from "@/shared/constants";
import { notFound } from "next/navigation";

// searchParams.subCategory → 필터 초기값 계산. 어떤 입력에도 throw하지 않는다(무효/부재 → "all").
function resolveInitialSubCategory(
  subCategory: string | string[] | undefined,
): SubCategory | "all" {
  if (typeof subCategory !== "string") return "all";
  return isSubCategory(subCategory) ? subCategory : "all";
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ subCategory?: string | string[] }>;
}) {
  const { category } = await params;

  // 세그먼트 값이 유효한 ProductCategory가 아니면 404
  if (!isProductCategory(category)) {
    notFound();
  }

  const { subCategory } = await searchParams;
  const initialSubCategory = resolveInitialSubCategory(subCategory);

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
          <ProductCatalog
            products={products}
            category={category}
            initialSubCategory={initialSubCategory}
          />
        </div>
      </div>
    </main>
  );
}
