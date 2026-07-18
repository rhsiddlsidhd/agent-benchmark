import Grid from "@/components/layout/Grid";
import { ProductCard } from "@/components/organisms/ProductCard";

import useVisibleProducts from "@/hooks/useVisibleProducts";
import { useProductFilter } from "@/context/productFilter/reducer";
import { Product } from "@/services/product.service";
import { TypographyMuted, TypographyP } from "../atoms/typoqraphy";
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
        <Grid slot="product">
          {visibleProducts.map((item) => (
            <ProductCard key={item._id} product={item} />
          ))}
        </Grid>
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
