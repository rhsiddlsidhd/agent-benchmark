"use client";

import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import {
  TypographyH2,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/client/components/atoms";
import { ProductCard } from "@/client/components/organisms";
import { Product } from "@/server/services";
import { POPULAR_PRODUCTS_MIN_ITEMS } from "@/shared/constants";

interface PopularProductsSectionProps {
  products: Product[];
}

export function PopularProductsSection({ products }: PopularProductsSectionProps) {
  if (products.length < POPULAR_PRODUCTS_MIN_ITEMS) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <TypographyH2 id="popular-products-heading" className="mb-4 border-none text-xl font-bold">
          인기 상품
        </TypographyH2>
        <Carousel
          aria-labelledby="popular-products-heading"
          opts={{ align: "start", loop: false, dragFree: true }}
          plugins={[WheelGesturesPlugin()]}
        >
          <CarouselContent>
            {products.map((product, index) => (
              <CarouselItem
                key={product._id}
                className="xs:w-[40%] w-[45%] basis-auto sm:w-56 md:w-60 lg:w-64"
              >
                <ProductCard product={product} rank={index + 1} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="-left-12" />
            <CarouselNext className="-right-12" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
