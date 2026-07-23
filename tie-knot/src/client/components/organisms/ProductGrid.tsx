"use client";

import { ProductCard } from "@/client/components/organisms/ProductCard";

import { useVisibleProducts } from "@/client/hooks";
import { useProductFilter } from "@/client/context/productFilter";
import { Product } from "@/server/services";
import { TypographyMuted, TypographyP } from "../atoms/typography";
import { PackageOpen } from "lucide-react";

export function ProductGrid({ data }: { data: Product[] }) {
  const [state] = useProductFilter();
  const { visibleProducts } = useVisibleProducts({
    state,
    data,
  });

  return (
    <>
      {visibleProducts.length !== 0 ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((item) => (
            <ProductCard key={item._id} product={item} />
          ))}
        </section>
      ) : (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full">
            <PackageOpen className="text-muted-foreground h-10 w-10 opacity-40" />
          </div>
          <TypographyP className="mb-2 text-xl font-semibold tracking-tight text-slate-900">
            상품을 준비 중에 있습니다
          </TypographyP>
          <TypographyMuted className="max-w-[280px] text-base leading-relaxed">
            보다 완성도 높은 디자인을 위해 <br />
            열심히 제작하고 있어요. 조금만 기다려주세요!
          </TypographyMuted>
        </div>
      )}
    </>
  );
}
