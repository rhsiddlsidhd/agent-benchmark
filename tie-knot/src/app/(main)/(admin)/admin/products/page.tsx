export const revalidate = 600;

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { getAllProductsService } from "@/services/product.service";
import { ProductTableRow } from "./_components/ProductTableRow";
import { TypographyH1, TypographyMuted } from "@/components/atoms/typoqraphy";

const tableColums = [
  "썸네일",
  "상품명",
  "카테고리",
  "가격",
  "타입",
  "상태",
  "통계",
  "우선순위",
  "관리",
];

export default async function ProductsPage() {
  const products = await getAllProductsService();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <TypographyH1 className="text-left mb-2 text-3xl font-bold">상품 목록</TypographyH1>
          <TypographyMuted>
            등록된 템플릿 상품을 관리합니다. (총 {products.length}개)
          </TypographyMuted>
        </div>
        <Link href="/admin/products/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            상품 등록
          </Button>
        </Link>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                {tableColums.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-sm font-semibold"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <ProductTableRow key={product._id} product={product} />
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="py-12 text-center">
            <TypographyMuted>등록된 상품이 없습니다.</TypographyMuted>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <TypographyMuted>
          총 {products.length}개 상품
        </TypographyMuted>
        <div className="flex gap-2">페이지네이션 버튼</div>
      </div>
    </div>
  );
}
