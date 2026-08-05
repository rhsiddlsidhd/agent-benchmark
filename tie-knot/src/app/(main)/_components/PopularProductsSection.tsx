import { TypographyH2 } from "@/client/components/atoms";
import { ProductCard } from "@/client/components/organisms";
import { Product } from "@/server/services";
import { POPULAR_PRODUCTS_MIN_ITEMS } from "@/shared/constants";

interface PopularProductsSectionProps {
  products: Product[];
}

export function PopularProductsSection({ products }: PopularProductsSectionProps) {
  if (products.length < POPULAR_PRODUCTS_MIN_ITEMS) return null;

  return (
    <section className="py-8" aria-labelledby="popular-products-heading">
      <div className="container mx-auto px-4">
        <TypographyH2 id="popular-products-heading" className="mb-4 border-none text-xl font-bold">
          인기 상품
        </TypographyH2>
        <ul className="flex gap-4 overflow-x-auto">
          {products.map((product, index) => (
            <li key={product._id} className="w-[45%] shrink-0">
              <ProductCard product={product} rank={index + 1} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
